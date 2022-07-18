const socket = io();

const messageTextarea = document.querySelector("#messageTextarea");
const messageArea = document.querySelector(".message_area");
const sendBtn = document.querySelector("#sendBtn");
const activeUsers__users = document.querySelector(".active__users .users");
const header__userProfile = document.querySelector(
  "section.chat__section header .userProfile .userName"
);
const status_area__typingUserName = document.querySelector(
  "section.chat__section .status_area p"
);

let userName = "";
let sender = "";
let receiver = "";

do {
  userName = prompt("Please Enter Your Name: ")?.trim();
} while (!userName);

header__userProfile.textContent = userName;

const scrollToBottom = () => (messageArea.scrollTop = messageArea.scrollHeight);

const appendMessage = (msg, type) => {
  const mainDiv = document.createElement("div");
  mainDiv.classList.add(type, "message");

  mainDiv.innerHTML = `
    <h4 class="massagerName">${
      msg.userName === userName ? "You" : msg.userName
    }</h4>
    <p class="mainMsg">${msg.message}</p>
    <p class="msgTime"><b>${new Date().toLocaleString()}</b></p>
  `;

  messageArea.appendChild(mainDiv);
  messageTextarea.value = "";
  scrollToBottom();
};

const sendMessage = (message) => {
  const data = {
    userName,
    message,
  };
  appendMessage(data, "outgoing");
  socket.emit("message", data);
};

const setConnectedUsers = (connectedUsers) => {
  activeUsers__users.innerHTML = "";
  Object.keys(connectedUsers).forEach((data_userName) => {
    if (data_userName === userName) return;
    const html = `<div class="user_container"><h4>${data_userName}</h4></div>`;
    activeUsers__users.insertAdjacentHTML("beforeend", html);
  });
};

socket.emit("newConnection", userName);

socket.on("newConnection", (data) => {
  setConnectedUsers(data.connectedUsers);
  appendMessage(data.messageData, "incoming");
});

socket.on("onDisconnection", (data) => {
  setConnectedUsers(data.connectedUsers);
  console.log(data.messageData);
  if (!data.messageData) return;
  appendMessage(data.messageData, "incoming");
});

socket.on("message", (message) => {
  appendMessage(message, "incoming");
});

sendBtn.addEventListener("click", (e) => {
  const message = messageTextarea.value?.trim();
  if (!message) return;
  sendMessage(message);
});

let flagForTyping = true;
messageTextarea.addEventListener("keydown", (e) => {
  if (flagForTyping) {
    socket.emit("typing", userName);
    flagForTyping = false;
    setTimeout(() => {
      flagForTyping = true;
    }, 300);
  }
});

let typingClearTimeout;
socket.on("typing", (userName) => {
  status_area__typingUserName.textContent = `${userName} is Typing...`;
  clearTimeout(typingClearTimeout);
  typingClearTimeout = setTimeout(() => {
    status_area__typingUserName.textContent = ``;
  }, 1000);
});

window.addEventListener("load", (event) => {
  setTimeout(() => {
    fetch("/connectedUsers")
      .then((response) => response.json())
      .then((data) => setConnectedUsers(data.data))
      .catch((err) => console.error(err));
  });
});
