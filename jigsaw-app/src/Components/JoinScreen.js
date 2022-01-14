import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import '../App.css'

export const JoinScreen = ({ socket }) => {
    const [codeValue, setCodeValue] = useState('');

    const handleSubmit = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }else{
            setCodeValue(codeValue.toUpperCase());
            event.preventDefault();
            socket.emit("joinRoom", codeValue);
        }
    }

    return (
        <div className="App-header">
            <Form onSubmit={e => (handleSubmit(e))}>
                <Form.Group>
                    <Form.Label>Enter code to room</Form.Label>
                    <Form.Control  
                    pattern="[a-zA-Z]+"
                    minLength= "4"
                    maxLength="4" 
                    required 
                    type="text" 
                    id="codeField" 
                    placeholder="Enter code here"
                    value={codeValue} 
                    onChange={e => setCodeValue(e.target.value)}/>
                    </Form.Group>
                <Button type="submit">Connect</Button>
            </Form>
        </div>
    )

}

export default JoinScreen;