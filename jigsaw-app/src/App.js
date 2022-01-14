import logo from './logo.png';
import './App.css';
import Button from 'react-bootstrap/Button';
import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
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
          <Container className='buttonStyleContainer'>
            <Button onClick={() => {setCurrentPage('createscreen')}}>Create new game</Button>
            <Col></Col>
            <Button onClick={() => {setCurrentPage('joinscreen')}}>Join a game</Button>
          </Container>
          </header>
      )}

      {currentPage === 'gamescreen' && (
        <GameScreen></GameScreen>
      )}

      {currentPage === 'createscreen' && (
        <CreateScreen socket={socket}></CreateScreen>
      )}

      {currentPage === 'joinscreen' && (
        <JoinScreen socket={socket}></JoinScreen>
      )}




    </div>
  );
}



export default App;
