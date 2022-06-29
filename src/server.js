import http from "http";
import { Server } from "socket.io"
import { instrument  } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set ("view engine", "pug");
app.set ("views", __dirname + "/views");
app.use ("/public", express.static(__dirname+"/public"));
app.get ("/", (req,res) => res.render("home"));
app.get ("/*", (req,res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`)

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
  }
});

instrument(wsServer, {
    auth: false
});
  

// 강의 2.8 참조, 모든 socket이 연결되자마자부터 들어가 있는 private room과 생성해서 들어간 public room 의 구분
// : private room은 sid에 일치하는 값이 있고 public room은 그렇지 않다. 
// 이것을 이용하여, adapter의 Map에서 sid를 확인하고 public room만 구해준다.
function publicRooms() {
    const {
        sockets: {
            adapter: { sids, rooms },
        },
    } = wsServer;    
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if( sids.get(key) === undefined ) {
            publicRooms.push(key)
        }
    });
    return publicRooms;
}

// 방 수가 아니라 특정 방 안의 사람(socket) 수를 구하는 것임
function countRoom (roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {   
    socket["nickname"] = "Anonymous"

    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event : ${event}`)        
    });

    socket.on("enter_room", (roomName, done) => {        
        socket.join(roomName);     
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    });

    //disconnecting과 disconnect는 다르다! 아직 안나갔다. 나가기 직전에 실행된다.
    //socket.rooms 표시는 {} 형태로 나오지만, 객체 아니고 이터러블임에 주의! forEach 쓸 수 있다.
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoom(room) -1 ));      
    });

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done(); 
    });

    socket.on("nickname", nickname => socket["nickname"] = nickname);    
});

httpServer.listen(3000, handleListen);