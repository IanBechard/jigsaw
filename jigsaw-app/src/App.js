import logo from './logo.png';
import './App.css';
import Button from 'react-bootstrap/Button';
import "bootstrap/dist/css/bootstrap.min.css";
import {useState, useEffect} from 'react'
import CreateScreen from "./Components/CreateScreen"
import JoinScreen from "./Components/JoinScreen"
import GameScreen from "./Components/GameScreen"
import {io} from 'socket.io-client'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [socket, setSocket] = useState(null);

  useEffect(() => {
      const newSocket = io.connect('http://localhost:9000');
      setSocket(newSocket);
      return () => newSocket.close();
  }, [setSocket]);


  return (
    <div className="App">
      {currentPage === 'home' && (
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Jigsaw puzzle with friends
          </p>
          <Button onClick={() => {setCurrentPage('gamescreen')}}>Create new game</Button>
          <Button onClick={() => {setCurrentPage('joinscreen')}}>Join a game</Button>
          </header>
      )}

      {currentPage === 'gamescreen' && (
        <GameScreen socket={socket}></GameScreen>
      )}

      {currentPage === 'createscreen' && (
        <CreateScreen></CreateScreen>
      )}

      {currentPage === 'joinscreen' && (
        <JoinScreen></JoinScreen>
      )}




    </div>
  );
}


export default App;
