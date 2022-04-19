const roomData = require('./roomData.js');
const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();


//map of roomcode to roomData object
const roomDataMap = new Map();

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
    socket.on("createRoomData", (code, difficulty, image, maxPlayers) => {createRoomDataHandler(code, difficulty, image, maxPlayers)});
    socket.on("roomDataRequest", (callback) => {roomDataRequestHandler(socket, callback)});
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


//Constants for generating piece layout in createRoomDataHandler
const canvasWidth = 1536;
const canvasHeight = 1000;
const imageWidth = 960;
const imageHeight = 540;
const offsetX = (canvasWidth/2) - (imageWidth/2);
const offsetY = (canvasHeight/2) - (imageHeight/2);
const pieceLength = imageHeight/9; //16:9 images


function createRoomDataHandler (code, difficulty, image, maxPlayers){
    code = code.toUpperCase()
    let data = new roomData();
    data.difficulty = difficulty;
    data.image = image;
    data.maxPlayers = maxPlayers;
    data.roomCode = code;
    data.pieceInit(imageWidth, imageHeight, offsetX, offsetY, pieceLength);
    roomDataMap.set(code, data);
}

function roomDataRequestHandler(socket, callback){
    code = [...socket.rooms].filter(rooms => rooms!==socket.id)[0]
    if(roomDataMap.has(code)){
        console.log("roomDataRequestHandler: sending room data")
        callback({roomData: roomDataMap.get(code)});
    }else{
        console.log("roomDataRequestHandler: data hasnt arrived yet or you're not in a room yet")
    }
}

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