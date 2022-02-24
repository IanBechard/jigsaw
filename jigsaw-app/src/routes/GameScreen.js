import React, {useEffect, useRef, useState, useCallback} from 'react';
import {insidePuzzlePiece, pieceInit} from '../helpers/puzzlePiece'

export const GameScreen = ({socket}) => {
        const canvasRef = useRef(null);
        const canvasWidth = 1536;
        const canvasHeight = 864 ;
        const imageWidth = 960;
        const imageHeight = 540;
        const offsetX = (canvasWidth/2) - (imageWidth/2);
        const offsetY = (canvasHeight/2) - (imageHeight/2);
        const canvasOffsetWidth = (window.innerWidth/2) - (canvasWidth/2)
        const canvasOffsetHeight = (window.innerHeight/2) - (canvasHeight/2)
        const pieceLength = imageHeight/9; //16:9 images
        const chosenImage = "http://localhost:9000/hyper960-540.png"
        const [pieces, setPieces] = useState(pieceInit(imageWidth, imageHeight, offsetX, offsetY, pieceLength));
        const [mouseX, setMouseX] = useState(0);
        const [mouseY, setMouseY] = useState(0);
        const [isDragging, setIsDragging] = useState(false);
        const [selectedPiece, setSelectedPiece] = useState(null);

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
        async function draw(ctx){
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
            canvas.onmousedown=handleMouseDown;
            //canvas.onmousemove=handleMouseMove;
            //canvas.onmouseup=handleMouseUp;
            //canvas.onmouseout=handleMouseOut;
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
        }, [pieces, socket])
        



        ///MOUSE EVENTS
        ///
        ///
        function handleMouseDown(e){
            // tell the browser we're handling this event
            e.preventDefault();
            e.stopPropagation();
            // calculate the current mouse position
            const fnmouseX = parseInt(e.clientX-canvasOffsetWidth);
            const fnmouseY = parseInt(e.clientY-canvasOffsetHeight);
            const inside = insidePuzzlePiece(fnmouseX, fnmouseY, pieces, pieceLength)
            // test mouse position against all pieces
            if(inside){
                setSelectedPiece(inside)
                setIsDragging(true);
                return;
            }
            
        }
        

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
                />
            </div>
        );
}

export default GameScreen;