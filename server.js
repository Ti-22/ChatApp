const express = require("express");
const app = express();
const http = require("http").createServer(app);
const PORT = process.env.PORT || 3001;

http.listen(PORT, () => console.log(`Server is live on PORT: ${PORT}`));

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

const connectedUsers = {};

app.get("/connectedUsers", (req, res) =>
  res.status(200).json({ data: connectedUsers })
);

const io = require("socket.io")(http);

io.on("connection", (socket) => {
  socket.on("newConnection", (username) => {
    connectedUsers[username] = socket.id;
    // console.log("socket->newConnection", connectedUsers);
    const data = {
      connectedUsers,
      messageData: {
        userName: "bateKaroBot",
        message: `${username?.toUpperCase()} Joined!`,
      },
    };
    socket.broadcast.emit("newConnection", data);
  });

  socket.on("message", (message) => socket.broadcast.emit("message", message));

  socket.on("typing", (username) => socket.broadcast.emit("typing", username));

  socket.on("disconnect", () => {
    const username = Object.keys(connectedUsers).find(
      (key) => connectedUsers[key] === socket.id
    );
    delete connectedUsers[username];
    const data = {
      connectedUsers,
      messageData: {
        userName: "bateKaroBot",
        message: `${username?.toUpperCase()} Disconnect!`,
      },
    };
    if (!Object.keys(connectedUsers).length) delete data.messageData;
    socket.broadcast.emit("onDisconnection", data);
    // console.log("socket->disconnect", connectedUsers);
  });

  // socket.on("messageTo", (message) => {
  //   socket
  //     .to(users[message.receiver])
  //     .emit("privatemessage", socket.id, message);
  // });
});
