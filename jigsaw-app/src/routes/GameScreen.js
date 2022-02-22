import React, {useEffect, useRef, useState} from 'react';

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
        //const [pieces, setPieces] = useState([]);
        //setPieces([...pieces, new PuzzlePiece(x, y, img)])
        function drawPiece(x, y, imageUrl, ctx){
            const img = new Image()
            img.addEventListener('load', e => {
                ctx.drawImage(img, x, y, 50, 50)
            })
            img.src = "http://localhost:9000/piece.png"
        }

        //draws on init
        function draw(ctx, canvas){

            //draw puzzle pieces
            for(let x = 0; x < 200; x+=50){
                for(let y = 0; y < 200; y+=50){
                    drawPiece(x, y, null, ctx)
                }
            }

            ctx.fillStyle = "blue";
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            //ctx.scale(1.1, 1.1) 
        }

        //canvasInit
        useEffect(() =>{
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            draw(ctx, canvas)
        })

        return(
            <div>
                <canvas 
                    ref={canvasRef}
                    width={window.innerWidth-100}
                    height={window.innerHeight-100}
                />
            </div>
        );
}

export default GameScreen;