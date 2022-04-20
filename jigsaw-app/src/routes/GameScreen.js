import React, {useEffect, useRef, useState, useCallback} from 'react';
import {insidePuzzlePiece, insidePieceGridPlace} from '../helpers/puzzlePiece'

export const GameScreen = ({socket}) => {
        const canvasRef = useRef(null);

        //constants used to gen canvas and puzzle pieces
        //note that in a better world these would be recieved by the server as data, and not exist in both as seperate vars
        const canvasWidth = 1536;
        const canvasHeight = 1000;
        const imageWidth = 960;
        const imageHeight = 540;
        const offsetX = (canvasWidth/2) - (imageWidth/2);
        const offsetY = (canvasHeight/2) - (imageHeight/2);
        const pieceLength = imageHeight/9; //16:9 images

        const canvasOffsetWidth = (window.innerWidth/2) - (canvasWidth/2)
        const canvasOffsetHeight = ((window.innerHeight)/2) - (canvasHeight/2)

        //roomData
        const [roomCode, setRoomCode] = useState('')
        const chosenImage = "http://jigsaw.ianbechard.ca/hyper960-540.png"
        const [pieces, setPieces] = useState(null); 


        const [mouseX, setMouseX] = useState(0);
        const [mouseY, setMouseY] = useState(0);
        const [isDragging, setIsDragging] = useState(false);
        const [selectedPiece, setSelectedPiece] = useState(null);
        const [sendSelectedPiece, setSendSelectedPiece] = useState(false)
        const puzzleImage = new Image()

        //Initial room data request and handling
        const handleRoomData = useCallback((roomData) => {
            console.log("room data recieved:")
            console.log(roomData)
            setPieces(roomData.pieces);
            setRoomCode(roomData.roomCode);
        }, [setPieces, setRoomCode]);

        useEffect(() =>{
            socket.emit('roomDataRequest', (response) => {handleRoomData((response['roomData']))});
        }, [socket, handleRoomData])

        
    
        

        //general onRender
        useEffect(() =>{   
            let requestId;

            //draws on refresh
            async function draw(ctx){
                if(isDragging && selectedPiece){
                    puzzleImage.onload = () =>{
                        ctx.drawImage(puzzleImage, selectedPiece.col*pieceLength, selectedPiece.row*pieceLength, pieceLength, pieceLength, selectedPiece.x, selectedPiece.y, pieceLength, pieceLength)
                    }
                    puzzleImage.src = chosenImage
                }
                else{
                    //full draw
                    ctx.fillStyle = "#323145";
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

                    //draw puzzle pieces
                    puzzleImage.onload = () =>{
                        for(let i = 0; i < pieces.length; i++){
                            ctx.drawImage(puzzleImage, pieces[i].col*pieceLength, pieces[i].row*pieceLength, pieceLength, pieceLength, pieces[i].x, pieces[i].y, pieceLength, pieceLength)
                            ctx.strokeRect(pieces[i].col*pieceLength+offsetX, pieces[i].row*pieceLength+offsetY, pieceLength, pieceLength)
                        }
                    }
                    
                }
                requestId = requestAnimationFrame(draw);
            }

            if(roomCode){ 
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d', {alpha: false});
                //draw game loop
                canvas.onmousedown=handleMouseDown;
                canvas.onmousemove=handleMouseMove;
                //canvas.onmouseup=handleMouseUp;
                //canvas.onmouseout=handleMouseOut;
                draw(ctx);
            }

            return () => {
                cancelAnimationFrame(requestId);
            };
        })


        ///PUZZLE PIECE REQUESTS
        ///
        ///
        
        //Recieve updated pieces
        useEffect(() => {
            socket.on('pieceUpdateToClient', (response) => {handleRoomData(response['roomData'])})
            return(() =>{
                socket.off('pieceUpdateToClient')
            })
        }, [socket, handleRoomData])
    
        //Send server updated pieces 
        useEffect(() =>{
            //if we are moving a piece send data
            if(sendSelectedPiece && selectedPiece){
                socket.emit('pieceUpdateToServer', selectedPiece)
                setSendSelectedPiece(false);
            }
        }, [pieces, socket, sendSelectedPiece, selectedPiece])
        

        //TODO: MAYBE ADD THIS??? FIGURE IT OUT kinda wonky
        //if we havent recieved piece data yet, generate puzzle
        /*
        useEffect(() =>{
            if(!pieces){
                setPieces(pieceInit(imageWidth, imageHeight, offsetX, offsetY, pieceLength))
            }
        }, [pieces, offsetX, offsetY, pieceLength])
        */

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
            if(isDragging){
                //If mouse is in box with correct piece, lock it in
                if(insidePieceGridPlace(fnmouseX, fnmouseY, selectedPiece, pieceLength, offsetX, offsetY)){
                    // Update piece object as locked in and update xy to proper grid place
                    const index = pieces.indexOf(selectedPiece)
                    let tempPieces = [...pieces]
                    let tempPiece = pieces[index]
                    tempPiece.x = tempPiece.col*pieceLength+offsetX;
                    tempPiece.y = tempPiece.row*pieceLength+offsetY;
                    tempPiece.locked = true;
                    tempPieces[index] = tempPiece;
                    setPieces(tempPieces);
                }
                setSendSelectedPiece(true);
                setSelectedPiece(null);
                setIsDragging(false);
            }else{
                const insidePiece = insidePuzzlePiece(fnmouseX, fnmouseY, pieces, pieceLength)
                // test mouse position against all pieces
                if(insidePiece){
                    if(!insidePiece.locked){
                        setSelectedPiece(insidePiece)
                        setIsDragging(true);
                    }
                }
            }   
            
        }

        //This function could be in instead of toggling clicking a piece, could be click and hold to drag
        /*
        function handleMouseUp(e){
            // return if we're not dragging
            if(!isDragging){return;}
            // tell the browser we're handling this event
            e.preventDefault();
            e.stopPropagation();

            // the drag is over, check if piece is in and clear drag flags
            const fnmouseX = parseInt(e.clientX-canvasOffsetWidth);
            setMouseX(fnmouseX);
            const fnmouseY = parseInt(e.clientY-canvasOffsetHeight);
            setMouseY(fnmouseY);
        
            
        }
        */

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

            //update pieces
            setSelectedPiece(tempPiece);
            setPieces(tempPieces);

            // update the starting drag position (== the current mouse position)
            setMouseX(fnmouseX);
            setMouseY(fnmouseY);

        }
        

        return(
            <>
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
                <p style={{backgroundColor: '#323145',
                            color:'white'
                            }}>
                                Room Code: {roomCode}</p>
            </>
        );
}

export default GameScreen;