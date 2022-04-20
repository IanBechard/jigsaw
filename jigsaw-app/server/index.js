const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();



const origin = "http://jigsaw.ianbechard.ca"
//const origin = "http://localhost:3000"

//Classes

class PuzzlePiece {
    constructor(x, y, col, row){
        this.x = x;
        this.y = y;
        this.col = col;
        this.row = row;
        this.locked = false;
    }
}

class roomData {
    constructor() {
        this.pieces = [];
        this.difficulty = "";
        this.image = 0;
        this.maxPlayers = 0;
        this.roomCode = "";
    }

    pieceInit(imageWidth, imageHeight, offsetX, offsetY, pieceLength){

        function getRandomXY() {
            let randX = Math.floor(Math.random() * (imageWidth + 2*offsetX - pieceLength)); 
            
            if(randX < (offsetX-pieceLength) || (randX) > (offsetX + imageWidth)){
                return [randX, Math.floor(Math.random() * (imageHeight + 2*offsetY - pieceLength))]
            }else{
                let randY = Math.floor(Math.random() * (imageHeight + 2*offsetY - pieceLength))
                if(randY < (offsetY - pieceLength) || (randY) > (offsetY + imageHeight)){
                    return [randX, randY]
                }else{
                    return getRandomXY()
                }
            }
            
        }
    
    
        let pieceArray = []
        for(let col = 0; col < 16; col++){
            for(let row = 0; row < 9; row++){
                const randPair = getRandomXY()
                pieceArray.push(new PuzzlePiece(randPair[0], randPair[1], col, row))
            }
        }
    
        this.pieces = pieceArray;
    }
}


//map of roomcode to roomData object
const roomDataMap = new Map();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);
app.use(express.static('public'))


const server = require('http').createServer(app);
const io = require('socket.io')(server, {
        cors: {
            origin: origin,
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
    socket.on("pieceUpdateToServer", (movingPiece) => {pieceUpdateToServerHandler(socket, movingPiece)})
    socket.on('disconnect', () => {
        console.log("user disconnected");
    });
});

server.listen(8080, () => {
    console.log('Socket.io server is running on localhost:8080')
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

function pieceUpdateToServerHandler (socket, movingPiece){
    code = [...socket.rooms].filter(rooms => rooms!==socket.id)[0]
    console.log(movingPiece + ' from ' + socket.id + ' in room ' + code)
    if(roomDataMap.has(code)){
        //update with new piece info
        let data = roomDataMap.get(code)
        let index = data.pieces.findIndex((element) => ((element.row === movingPiece.row) && (element.col === movingPiece.col)))
        data.pieces[index] = movingPiece;
        roomDataMap.set(code, data)

        //send it to everyone else
        socket.to(code).emit('pieceUpdateToClient', {roomData: data})
    }
    else{
        console.log("pieceUpdateToServerHandler: roomData not found in map")
    }
}   
