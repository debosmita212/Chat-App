const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require('./utils/users')
const qs = require("qs");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatApp bot";

//Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user=userJoin(socket.id,username,room)
    socket.join(user.room);
    //console.log('New WS Connection.....');
    //this will only emit to the user when user is welcomed into the chat
    socket.emit("message", formatMessage(botName, "Welcome to Chat-App"));

    //broadcast everyone except user when a user connects to a specific room
    socket.broadcast.to(user.room).emit(
      "message",
      formatMessage(botName, `${user.username} has joined the chat`)
    );
    //Send users and room info
    io.to(user.room).emit('roomUsers',{
      room:user.room,
      users:getRoomUsers(user.room)
    })
  });

  //Listen for chat message
  socket.on("chatMessage", (msg) => {
    //console.log(msg);
    const user=getCurrentUser(socket.id)
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //broadcast everyone except user when a user disconnects
  socket.on("disconnect", () => {
    const user=userLeave(socket.id)
    if(user){
      io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat`));
      //Send users and room info
    io.to(user.room).emit('roomUsers',{
      room:user.room,
      users:getRoomUsers(user.room)
    })

    }
  });

  //broadcast everyone
  //io.emit()
  
});
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
