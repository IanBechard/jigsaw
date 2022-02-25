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
        const [pieces, setPieces] = useState(null);
        const [mouseX, setMouseX] = useState(0);
        const [mouseY, setMouseY] = useState(0);
        const [isDragging, setIsDragging] = useState(false);
        const [selectedPiece, setSelectedPiece] = useState(null);
        const puzzleImage = new Image()

        //draws on refresh
        async function draw(ctx){
            ctx.fillStyle = "#323145";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight)
            //draw puzzle pieces
            puzzleImage.onload = () =>{
                for(let i = 0; i < pieces.length; i++){
                    //await drawPiece(pieces[i], ctx)
                    ctx.drawImage(puzzleImage, pieces[i].col*pieceLength, pieces[i].row*pieceLength, pieceLength, pieceLength, pieces[i].x, pieces[i].y, pieceLength, pieceLength)
                    ctx.strokeRect(pieces[i].col*pieceLength+offsetX, pieces[i].row*pieceLength+offsetY, pieceLength, pieceLength)
                }
            }
            puzzleImage.src = chosenImage
            
        }

        //general onRender
        useEffect(() =>{   
            //draw game loop
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', {alpha: false});
            canvas.onmousedown=handleMouseDown;
            canvas.onmousemove=handleMouseMove;
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
            //if we are moving a piece send data
            if(isDragging){
                socket.emit('pieceUpdateToServer', JSON.stringify(pieces))
            }
        }, [pieces, socket, isDragging])

        //TODO: MAYBE ADD THIS??? FIGURE IT OUT kinda wonky
        //if we havent recieved piece data yet, generate puzzle
        useEffect(() =>{
            if(!pieces){
                setPieces(pieceInit(imageWidth, imageHeight, offsetX, offsetY, pieceLength))
            }
        }, [pieces, offsetX, offsetY, pieceLength])


        ///MOUSE EVENTS
        ///
        ///
        function handleMouseDown(e){
            // tell the browser we're handling this event
            e.preventDefault();
            e.stopPropagation();
            // calculate the current mouse position
            const fnmouseX = parseInt(e.clientX-canvasOffsetWidth);
            setMouseX(fnmouseX);
            const fnmouseY = parseInt(e.clientY-canvasOffsetHeight);
            setMouseY(fnmouseY);
            const insidePiece = insidePuzzlePiece(fnmouseX, fnmouseY, pieces, pieceLength)
            // test mouse position against all pieces
            if(insidePiece){
                setSelectedPiece(insidePiece)
                setIsDragging(true);
                return;
            }
            
        }

        function handleMouseMove(e){
            // return if we're not dragging
            if(!isDragging){return;}
            // tell the browser we're handling this event
            e.preventDefault();
            e.stopPropagation();
            // calculate the current mouse position         
            const fnmouseX = parseInt(e.clientX-canvasOffsetWidth);
            const fnmouseY = parseInt(e.clientY-canvasOffsetHeight);
            // how far has the mouse dragged from its previous mousemove position?
            const dx=fnmouseX-mouseX;
            const dy=fnmouseY-mouseY;
            // Update piece object with new xy
            const index = pieces.indexOf(selectedPiece)
            let tempPieces = [...pieces]
            let tempPiece = pieces[index]
            tempPiece.x += dx;
            tempPiece.y += dy;
            tempPieces[index] = tempPiece;
            setPieces(tempPieces);
            // update the starting drag position (== the current mouse position)
            setMouseX(fnmouseX);
            setMouseY(fnmouseY);
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