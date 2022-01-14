import React, {useCallback, useEffect, useState} from 'react';
import {Container, Form, Row, Col, Button} from 'react-bootstrap'
import '../App.css';
import RangeSlider from 'react-bootstrap-range-slider';

export const CreateScreen = ({socket}) => {
    const [roomCode, setRoomCode] = useState(null);
    const [difficulty, setDifficulty] = useState('medium');
    const [image, setImage] = useState(1);
    const [maxPlayers, setMaxPlayers] = useState(1);

    const handlePing = useCallback(() => {
        console.log("ping recieved")
    }, []);

    const handleRoomCode = useCallback((roomCode) => {
        console.log(roomCode)
        setRoomCode(roomCode)
    }, [setRoomCode]);

    const handleSubmit = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }else{
            event.preventDefault();
            console.log(difficulty)
            console.log(image)
            console.log(maxPlayers)
        }
    }

    useEffect(() => {
        socket.emit('createRoom')
        socket.on('ping', handlePing);
        socket.on('roomCode', (msg) => {handleRoomCode(msg)})

        return () => {
            socket.off('ping', handlePing)
            socket.off('roomCode', handleRoomCode)
        };
    }, [socket, handlePing, handleRoomCode]);


    return(
        <div className="App-header">
            <Container>
            <p>Room Code: {roomCode}</p>
                <Form onSubmit={e => (handleSubmit(e))}>
                    <Row>
                        <Col>
                            <Form.Label>Select Difficulty</Form.Label>
                        </Col>
                        <Col>
                            <Form.Check 
                                type='radio'
                                inline
                                name='difficulty'
                                label='Easy'
                                id='easy'
                                onChange={e => setDifficulty(e.target.id)}/>
                            <Form.Check 
                                type='radio'
                                inline
                                name='difficulty'
                                label='Medium'
                                id='medium'
                                defaultChecked
                                onChange={e => setDifficulty(e.target.id)}/>
                            <Form.Check 
                                type='radio'
                                inline
                                name='difficulty'
                                label='Hard'
                                id='hard'
                                onChange={e => setDifficulty(e.target.id)}/>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Form.Label>Select Image</Form.Label>
                        </Col>
                        <Col>
                            <Form.Select
                                onChange={e => {setImage(e.target.value)}}
                            >
                                <option value='1'>Image A</option>
                                <option value='2'>Image B</option>
                            </Form.Select>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Form.Label>Maximum Number of Players </Form.Label>
                        </Col>
                        <Col>
                            <RangeSlider 
                                    min={1}
                                    max={20}
                                    value={maxPlayers} 
                                    step={1}
                                    tooltip="on"
                                    onChange={e => {setMaxPlayers(e.target.value)}}
                            />
                        </Col>
                    </Row>
                    <Button type="submit">Connect</Button>
                </Form>
            </Container>
        </div>
    );
}

export default CreateScreen;