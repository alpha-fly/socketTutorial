//io(); socketIO 서버를 알아서 찾는다. 
const socket = io();

const welcome = document.getElementById("welcome")
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName = ""

function addMessage(message) {
    const ul = room.querySelector("ul")
    const li = document.createElement("li")
    li.innerText = message;
    ul.appendChild(li);
}

/// 여기부터
const nameForm = welcome.querySelector("#name");
nameForm.addEventListener("submit", handleNicknameSubmit)

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = welcome.querySelector("#name input");    
    socket.emit("nickname", input.value);
}
/// 여기까지

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You : ${value}`);    
    });
    input.value=""
}

function showRoom() {
    welcome.hidden = true;    
    room.hidden = false;

    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;

    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit)         
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");

    // arguments : 1)name of event, 2)payload(*여러 개 가능) or callback function (마지막 것은 콜백함수가 될 수 있다)
    // 프론트에서 설정한 socket.emit의 콜백함수는 백엔드가 아닌 프론트에서 실행됨을 명심하기! 프론트가 백엔드에 코드를 실행하게 하면 보안문제
    // 단 이 때 callback 함수는 backend에서 인자를 가져올 수 있다! 개쩜
    socket.emit("enter_room", input.value, showRoom);
    roomName = input.value;
    input.value="";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} joined!`)
})

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left...`)
})

socket.on("new_message", (msg) => {addMessage(msg)});

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = ""
    if (rooms.length === 0) {
        roomList.innerHTML = ""
        return;
    }    
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    })
});

