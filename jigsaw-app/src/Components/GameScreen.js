import React, { useEffect } from 'react';

export const GameScreen = ({socket}) => {
        useEffect(() => {
            socket.emit('createRoom')
        });

        return(
            <p>gameballs</p>
        );
}

export default GameScreen;