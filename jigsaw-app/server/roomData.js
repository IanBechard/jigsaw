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
    
    getUpdatePieces(newPiece){
        index = null
        this.pieces.map((fnpiece) => {
            if((newPiece.row === fnpiece.row) && (newPiece.col === fnpiece.col)){
                index = this.pieces.indexOf(fnpiece)
            }
        })

        if(index){
            this.pieces[index] = piece
        }

        return pieces
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
        return this.pieces
    }
}

module.exports = roomData;

