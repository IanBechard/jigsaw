const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);
app.use(express.static('public'))


const server = require('http').createServer(app);
const io = require('socket.io')(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

io.on('connection', (socket) => {
    console.log("user connected");

    //recieving signals
    socket.on("createRoom", () => {createRoomHandler(socket, io)});
    socket.on("joinRoom", (code) => {joinRoomHandler(socket, io, code)});
    socket.on("destroyRoom", (code) => {destroyRoomHandler(io, code)});
    socket.on("pieceUpdateToServer", (pieces) => {pieceUpdateToServerHandler(socket, pieces)})
    socket.on('disconnect', () => {
        console.log("user disconnected");
    });
});

server.listen(9000, () => {
    console.log('Socket.io server is running on localhost:9000')
})

function createRoomHandler (socket, io){
    let code = ""
    while(true){
        for (let i = 0; i < 4; i++){
            code += String.fromCharCode(Math.random() * (90 - 65) + 65)
        } 
        if(!io.of("/").adapter.rooms.has(code)){break;}
    }
    console.log("room created: " + code);
    socket.join(code);
    console.log(socket.id + " joined room: " + code)
    socket.emit('roomCode', code)
    io.to(code).emit('ping')
};

function destroyRoomHandler (io, roomCode){
    io.socketsLeave(roomCode)
    console.log(io.of("/").adapter.rooms)

}

function joinRoomHandler (socket, io, code){
    code = code.toUpperCase()
    if(io.of("/").adapter.rooms.has(code)){
        console.log(socket.id + " joined room: " + code)
        socket.join(code)
        console.log(io.of("/").adapter.rooms)
        console.log(socket.rooms)
    }else{
        console.log("attempted to join room that does not exist")
    }
};

function pieceUpdateToServerHandler (socket, pieces){
    console.log('pieces update sent from server from ' + socket.id)
    socket.to([...socket.rooms].filter(rooms => rooms!==socket.id)[0]).emit('pieceUpdateToClient', pieces)
}