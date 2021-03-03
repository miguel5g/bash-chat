const express = require('express');
const cors = require('cors');
const socketIO = require("socket.io");
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

const rooms = {
  test: {
    name: 'test',
    users: [],
  }
};
const users = {};

app.get('/rooms', (req, res) => {
  const parsedRooms = Object.keys(rooms).map((key) => {
    const room = rooms[key];

    return {
      name: room.name,
      size: room.users.length,
    };
  });

  return res.json(parsedRooms);
});

io.on('connection', (socket) => {
  console.log(`[${socket.id}] User connection`);

  users[socket.id] = {
    socket,
    user: null,
  };

  socket.on('disconnect', () => {
    console.log(`[${socket.id}] User disconnected`);
    delete users[socket.id];

    let room = null;

    Object.keys(rooms).forEach((key) => {
      if (rooms[key].users.includes(socket.id)) room = key;
    });

    if (!room) return;

    rooms[room].users = rooms[room].users.filter((user) => user !== socket.id);

    if (rooms[room].users.length <= 0) delete rooms[room];
  });

  socket.on('change_user', (data) => {
    console.log(`[${socket.id}] Change user: ${users[socket.id].user} -> ${data.user}`);
    users[socket.id].user = data.user;
  });

  socket.on('create_room', (data, cb) => {
    console.log(`[${socket.id}] Create room: ${data.name}`);

    if (rooms[data.name]) {
      return cb(false);
    }

    cb(true);
    rooms[data.name] = {
      name: data.name,
      users: [socket.id],
    };
  });

  socket.on('join_room', (data, cb) => {
    console.log(`[${socket.id}] Join room: ${data.name}`);

    if (!rooms[data.name]) {
      return cb(404);
    }

    rooms[data.name].users.push(socket.id);
    return cb(200);
  });

  socket.on('quit_room', (data, cb) => {
    console.log(`[${socket.id}] Quit room: ${data.name}`);

    if (!rooms[data.name]) {
      return cb(404);
    }

    rooms[data.name].users = rooms[data.name].users.filter((user) => user !== socket.id);
    cb(200);

    if (rooms[data.name].users.length <= 0) delete rooms[data.name];
  });

  socket.on('send_message', (data) => {
    console.log(`[${socket.id}] Send message: ${data.name}`);

    if (!rooms[data.name]) {
      return cb(404);
    }

    const sender = users[socket.id];

    rooms[data.name].users.filter((user) => user !== socket.id).forEach((user) => {
      users[user].socket.emit('message', { user: sender.user, message: data.message });
    });
  });
});

server.listen(process.env.PORT || 3333, (err) => {
  if (err) console.log(err);

  console.log(`Server listener on ${process.env.PORT || 3333}`);
});