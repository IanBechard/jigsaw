export class PuzzlePiece {
    constructor(x, y, col, row){
        this.x = x;
        this.y = y;
        this.col = col;
        this.row = row;
        this.locked = false;
    }
}

export const insidePuzzlePiece = (x, y, pieces, pieceLength) => {
    for(let i = 0; i < pieces.length; i++){
        //in x and y range of piece
        if(((pieces[i].x < x) && (x < (pieces[i].x + pieceLength))) && ((pieces[i].y < y) && (y < (pieces[i].y + pieceLength)))){
            return(pieces[i])
        }
    }
    return null
}

export const insidePieceGridPlace = (x, y, piece, pieceLength, offsetX, offsetY) => {
    const pieceX = piece.col*pieceLength+offsetX
    const pieceY = piece.row*pieceLength+offsetY
    if((x >= pieceX && x <= pieceX+pieceLength) && (y >= pieceY && y <= pieceY+pieceLength)){
        return true;
    }
    return false;
}


