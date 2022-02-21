import logo from './logo.png';
import './App.css';
import Button from 'react-bootstrap/Button';
import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import "bootstrap/dist/css/bootstrap.min.css";
import CreateScreen from "./routes/CreateScreen"
import JoinScreen from "./routes/JoinScreen"
import {useState, useEffect} from 'react'
import {io} from 'socket.io-client'
import {Outlet, useNavigate, Route, Routes } from "react-router-dom";

function App() {
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate()

  useEffect(() => {
      const newSocket = io.connect('http://localhost:9000');
      setSocket(newSocket);
      return () => newSocket.close();
  }, [setSocket]);


  return (
    <div className="App">

      <Routes>
        <Route path="create" element={<CreateScreen socket={socket}/>}/>
        <Route path="join" element={<JoinScreen socket={socket}/>}/>
      </Routes>

      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Jigsaw puzzle with friends
        </p>
        <Container className='buttonStyleContainer'>
          <Button onClick={() => {navigate("/create")}}>Create new game</Button>
          <Col></Col>
          <Button onClick={() => {navigate("/join")}}>Join a game</Button>
        </Container>
        </header>

      <Outlet />

    </div>
  );
}

/*
{currentPage === 'gamescreen' && (
        <GameScreen></GameScreen>
      )}

      {currentPage === 'createscreen' && (
        <CreateScreen socket={socket}></CreateScreen>
      )}

      {currentPage === 'joinscreen' && (
        <JoinScreen socket={socket}></JoinScreen>
      )}
*/

export default App;
