import React, {useRef, useState} from 'react';

//Puzzle piece object
class PuzzlePiece {
    constructor(x, y, image){
        this.x = x;
        this.y = y;
        this.image = image;
    }
}

export const GameScreen = ({socket}) => {
        const canvasRef = useRef(null);
        const [pieces, setPieces] = useState([]);

        function createPiece(x, y, image){
            let img = new Image()
            img.src = "http://localhost:9000/piece.png"
            setPieces([...pieces, new PuzzlePiece(50, 50, img)])
        }

        //draws on canvas update
        function draw(ctx, canvas){
            const img = new Image()
            img.src = "http://localhost:9000/piece.png"
            img.addEventListener('load', e => {
                ctx.drawImage(img, 50, 50)
            })
            console.log(img)
            ctx.fillStyle = "blue";
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.scale(1.1, 1.1) 
        }

        return(
            <div>
                <canvas 
                    ref={canvasRef}
                    width={window.innerWidth-100}
                    height={window.innerHeight-100}
                    onClick={() => {
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        draw(ctx, canvas)
                    }}/>
            </div>
        );
}

export default GameScreen;