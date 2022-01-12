import React, {useEffect, useState} from 'react';
import {io} from 'socket.io-client'
export const GameScreen = (props) => {
        const [socket, setSocket] = useState(null);

        const connect = () =>{
            setSocket(io.connect('http://localhost:9000'));
        }

        useEffect(() => {
            connect();
        }, []);

        return(
            <p>gameballs</p>
        );
}

export default GameScreen;