import React, {useEffect, useRef, useState, useCallback} from 'react';
import {pieceInit} from '../helpers/puzzlePiece'

export const GameScreen = ({socket}) => {
        const canvasRef = useRef(null);
        const canvasWidth = 1536;
        const canvasHeight = 864 ;
        const imageWidth = 960;
        const imageHeight = 540;
        const offsetX = (canvasWidth/2) - (imageWidth/2);
        const offsetY = (canvasHeight/2) - (imageHeight/2);
        const pieceLength = imageHeight/9;
        const chosenImage = "http://localhost:9000/hyper960-540.png"
        const [pieces, setPieces] = useState(pieceInit(imageWidth, imageHeight, offsetX, offsetY, pieceLength));
        

        ///DRAWING FUNCTIONS
        ///
        ///
        //draws given puzzle piece
        function drawPiece(piece, ctx){
            return new Promise(resolve => {
                const img = new Image()
                img.addEventListener('load', e => {
                    ctx.drawImage(img, piece.col*pieceLength, piece.row*pieceLength, pieceLength, pieceLength, piece.x, piece.y, pieceLength, pieceLength)
                    resolve('resolved')
                })
                img.src = chosenImage
                ctx.strokeRect(piece.col*pieceLength+offsetX, piece.row*pieceLength+offsetY, pieceLength, pieceLength)
            })
        }

        //draws on refresh
        async function draw(ctx, canvas){
            
            ctx.fillStyle = "#323145";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight)
            //draw puzzle pieces
            for(let i = 0; i < pieces.length; i++){
                await drawPiece(pieces[i], ctx)
            }
        }

        //general onRender
        useEffect(() =>{   
            //draw game loop
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            draw(ctx, canvas)
        })




        ///PUZZLE PIECE REQUESTS
        ///
        ///
        const handlePieceUpdate = useCallback((piecesFromServer) =>{
            if(JSON.stringify(pieces) !== JSON.stringify(piecesFromServer)){
                setPieces(piecesFromServer)
                console.log('recieved pieces and modified')
            }
            console.log('recieved and not modified')
        }, [pieces, setPieces]);
        
        
        //Recieve updated pieces
        useEffect(() => {
            socket.on('pieceUpdateToClient', (piecesFromServer) => {handlePieceUpdate(JSON.parse(piecesFromServer))})
            return(() =>{
                socket.off('pieceUpdateToClient')
            })
        }, [socket, handlePieceUpdate])
    
        //Send server updated pieces 
        useEffect(() =>{
            socket.emit('pieceUpdateToServer', JSON.stringify(pieces))
        }, [pieces, socket, offsetX, offsetY, pieceLength])
        

        
        

        return(
            <div style={{backgroundColor: '#19232b',
                        width: window.innerWidth,
                        height: window.innerHeight,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                        }}>
                <canvas 
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    onClick={() =>{setPieces([...pieces])}}
                />
            </div>
        );
}

export default GameScreen;