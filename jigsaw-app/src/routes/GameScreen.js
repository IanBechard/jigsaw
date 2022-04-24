import React, {useEffect, useRef, useState, useLayoutEffect, useCallback} from 'react';
import {Container, Button, Row } from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import {insidePuzzlePiece, insidePieceGridPlace} from '../helpers/puzzlePiece'

export const GameScreen = ({socket}) => {
        const canvasRef = useRef(null);
        const navigate = useNavigate();
        //constants used to gen canvas and puzzle pieces
        //note that in a better world these would be recieved by the server as data, and not exist in both as seperate vars
        const canvasWidth = 1536;
        const canvasHeight = 1000;
        const imageWidth = 960;
        const imageHeight = 540;
        const offsetX = (canvasWidth/2) - (imageWidth/2);
        const offsetY = (canvasHeight/2) - (imageHeight/2);
        const pieceLength = imageHeight/9; //16:9 images

        const [canvasOffsetWidth, setCanvasOffsetWidth] = useState(0)
        const [canvasOffsetHeight, setCanvasOffsetHeight] = useState(0)

        //Image urls for choice
        const chosenImageArray = [
            (process.env.REACT_APP_API_URL + "/puzzleImages/hyperbeast_960-540.png"),
            (process.env.REACT_APP_API_URL + "/puzzleImages/hyperbeast2_960-540.png"),
            (process.env.REACT_APP_API_URL + "/puzzleImages/bloodMoonPixel_960-540.png"),
            (process.env.REACT_APP_API_URL + "/puzzleImages/pixelFlower_960-540.png")
        ];

        //roomData
        const [roomCode, setRoomCode] = useState('')
        const [chosenImageIndex, setChosenImageIndex] = useState(0)
        const [pieces, setPieces] = useState(null); 

        //Mouse and selected piece state
        const [mouseX, setMouseX] = useState(0);
        const [mouseY, setMouseY] = useState(0);
        const [isDragging, setIsDragging] = useState(false);
        const [selectedPiece, setSelectedPiece] = useState(null);
        const [sendSelectedPiece, setSendSelectedPiece] = useState(false)

        //Reference Image button
        const [showReferenceImage, setShowReferenceImage] = useState(false)
        const [refImageButtonText, setRefImageButtonText] = useState("Show Reference Image")

        const puzzleImage = new Image()

        //Initial room data request and handling
        const handleRoomData = useCallback((roomData) => {
            console.log("room data recieved:")
            console.log(roomData)
            setPieces(roomData.pieces);
            setRoomCode(roomData.roomCode);
            setChosenImageIndex(roomData.image);
            setShouldHaltRender(false); //starts our game loop
        }, [setPieces, setRoomCode]);

        useEffect(() =>{
            socket.emit('roomDataRequest', (response) => {
                if(response && !response.error){
                    handleRoomData((response['roomData']))
                }else{//we arent in a room so we probably lost connection or refreshed, in that case leave room and go to home
                    socket.emit('leaveRoom', roomCode);
                    navigate('../')
                }

            });
        }, [socket, handleRoomData, navigate, roomCode])

    

        ///RENDER LOOP STUFF

        const [counter, setCounter] = useState(0)
        const [shouldHaltRender, setShouldHaltRender] = useState(true)

        // update the counter
        useLayoutEffect(() => {
            if (!shouldHaltRender) {
                let timerId

                const animate = () => {
                    setCounter(n => n + 1)
                    timerId = requestAnimationFrame(animate)
                }
                timerId = requestAnimationFrame(animate)
                return () => cancelAnimationFrame(timerId)
            }
        }, [shouldHaltRender])

        // output graphics
        useEffect(() => {
            if(roomCode){
                const canvas = canvasRef.current;
                const ctx = canvasRef.current.getContext('2d', {alpha: false});
                setCanvasOffsetWidth(canvas.getBoundingClientRect().left)
                setCanvasOffsetHeight(canvas.getBoundingClientRect().top)
                //Initialize mouse events
                canvas.onmousedown=handleMouseDown;
                canvas.onmousemove=handleMouseMove;

                ctx.fillStyle = "#323145";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight)

                //draw puzzle pieces
                puzzleImage.onload = () =>{
                    for(let i = pieces.length - 1; i >= 0; i--){//this array being backwards lets us pick up the top piece when clicking on it instead of the bottom if they are piled
                        ctx.drawImage(puzzleImage, pieces[i].col*pieceLength, pieces[i].row*pieceLength, pieceLength, pieceLength, pieces[i].x, pieces[i].y, pieceLength, pieceLength)
                        ctx.strokeRect(pieces[i].col*pieceLength+offsetX, pieces[i].row*pieceLength+offsetY, pieceLength, pieceLength)
                    }
                }
                puzzleImage.src = chosenImageArray[chosenImageIndex];
            }
            //eslint-disable-next-line
        }, [counter])


        ///PUZZLE PIECE REQUESTS
        ///
        ///
        
        //Recieve updated pieces
        useEffect(() => {
            socket.on('pieceUpdateToClient', (response) => {handleRoomData(response['roomData'])})
            return(() =>{
                socket.off('pieceUpdateToClient')
            })
        }, [socket, handleRoomData, roomCode])
    
        //Send server updated pieces 
        useEffect(() =>{
            //if we are moving a piece send data
            if(sendSelectedPiece && selectedPiece){
                socket.emit('pieceUpdateToServer', selectedPiece)
                setSendSelectedPiece(false);
            }
        }, [pieces, socket, sendSelectedPiece, selectedPiece])
        

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

                    //Check if you won
                    let lockedPiecesCount = 0
                    for(let i = 0; i < pieces.length; i++){
                        if(pieces[i].locked){
                            lockedPiecesCount++
                        }
                    }
                    console.log(lockedPiecesCount)
                    if(lockedPiecesCount === pieces.length){
                        alert("Congratulations, you have completed the puzzle!")
                    }
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

            //update piece x
            tempPiece.x += dx;
            if(tempPiece.x < 0 || tempPiece.x > canvasWidth-(pieceLength/4)){//make sure not out of bounds, piecelength only allows for so much of a piece to be hidden
                tempPiece.x = 0;
            }

            //update piece y
            tempPiece.y += dy;
            if(tempPiece.y < 0 || tempPiece.y > canvasHeight-(pieceLength/4)){
                tempPiece.y = 0;
            }
            tempPieces[index] = tempPiece;

            //update pieces
            setSelectedPiece(tempPiece);
            setPieces(tempPieces);

            // update the starting drag position (== the current mouse position)
            setMouseX(fnmouseX);
            setMouseY(fnmouseY);

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

        return(
            <>
                <div style={{backgroundColor: '#282c34',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                            }}>
                    <Container className='App-header'>
                        <Row>
                            {showReferenceImage && <img src={chosenImageArray[chosenImageIndex]} alt="server down sorry :("></img>}
                        </Row>
                        <Row>
                            <Button className="leftAlign">Room Code: {roomCode}</Button>
                            <Button id = "refImageButton" onClick={(e) => {
                                setShowReferenceImage(!showReferenceImage); 
                                showReferenceImage ? setRefImageButtonText("Show Reference Image") : setRefImageButtonText("Hide Reference Image");
                            }}>
                            {refImageButtonText}
                            </Button>
                        </Row>
                        <Row>
                            <canvas 
                                            ref={canvasRef}
                                            width={canvasWidth}
                                            height={canvasHeight}
                            />
                        </Row>
                    </Container>
                </div>
            </>
        );
}

export default GameScreen;