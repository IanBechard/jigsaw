//For deployment
//sudo iptables -I INPUT -p tcp --dport 80 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT
//sudo iptables -I OUTPUT -p tcp --sport 80 -m conntrack --ctstate ESTABLISHED -j ACCEPT


const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();


const origin = process.env.SERVER_ORIGIN

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
    socket.on("joinRoom", (code, callback) => {joinRoomHandler(socket, io, code, callback)});
    socket.on("leaveRoom", (code) => {leaveRoomHandler(socket, code)});
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
    while(true){ //Generate random 4-char code
        for (let i = 0; i < 4; i++){
            code += String.fromCharCode(Math.random() * (90 - 65) + 65)
        } 
        if(!io.of("/").adapter.rooms.has(code)){break;}//make sure we didn't generate a code currently in use
    }
    
    //leave all previous rooms to avoid navigation errors
    socket.rooms.forEach((room) => {if(room!==socket.id){
        console.log(socket.id + " left room " + room); 
        socket.leave(room)}})

    console.log("room created: " + code);
    socket.join(code);
    console.log(socket.id + " joined room: " + code)
    socket.emit('roomCode', code)
};



function createRoomDataHandler (code, difficulty, image, maxPlayers){
    //Constants for generating piece layout in createRoomDataHandler
    const canvasWidth = 1536;
    const canvasHeight = 1000;
    const imageWidth = 960;
    const imageHeight = 540;
    const offsetX = (canvasWidth/2) - (imageWidth/2);
    const offsetY = (canvasHeight/2) - (imageHeight/2);
    const pieceLength = imageHeight/9; //16:9 images

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
        callback({error: "no room data"})
    }
}

function destroyRoomHandler (io, roomCode){
    io.socketsLeave(roomCode)
    roomDataMap.delete(roomCode)
    console.log(io.of("/").adapter.rooms)

}

function leaveRoomHandler(socket, code){
    code = code.toUpperCase()

    socket.leave(code);
    console.log("leaveRoomHandler: " + socket.id + " left room " + code)
}

function joinRoomHandler (socket, io, code, callback){
    code = code.toUpperCase()
    if(io.of("/").adapter.rooms.has(code)){ //If the room exists
        if(roomDataMap.has(code)){
            currentNumPlayers = io.of("/").adapter.rooms.get(code).size
            roomMaxPlayers = roomDataMap.get(code).maxPlayers
            if(currentNumPlayers < roomMaxPlayers){ //Check if space available in room
                //leave all previous rooms to avoid navigation errors
                socket.rooms.forEach((room) => {if(room!==socket.id){console.log(socket.id + " left room " + room); socket.leave(room)}})

                console.log(socket.id + " joined room: " + code)
                socket.join(code)
                console.log(io.of("/").adapter.rooms)
                console.log(socket.rooms)
                callback({})
            }else{//No space
                callback({error: "Room is full"})
            }
        }
        else{
            callback({error: "Room has not been started yet"})
        }
    }else{//Room doesnt exist
        callback({error: "Room does not exist"})
    }
};

function pieceUpdateToServerHandler (socket, movingPiece){
    code = [...socket.rooms].filter(rooms => rooms!==socket.id)[0]
    console.log('piece row:' + movingPiece.row + ' col:' + movingPiece.col +' from ' + socket.id + ' moved in room ' + code)
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
