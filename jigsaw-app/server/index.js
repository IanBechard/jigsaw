const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

io.on('connection', (socket) => {
    console.log("user connected")
    socket.on("createRoom", () => {
        console.log("room created")
    })

    socket.on('disconnect', () => {
        console.log("user disconnected")
    })
});

server.listen(9000, () => {
    console.log('Socket.io server is running on localhost:9000')
})
