import logo from './logo.png';
import './App.css';
import Button from 'react-bootstrap/Button';
import Container from "react-bootstrap/Container"
import Col from "react-bootstrap/Col"
import "bootstrap/dist/css/bootstrap.min.css";
import CreateScreen from "./routes/CreateScreen"
import JoinScreen from "./routes/JoinScreen"
import GameScreen from "./routes/GameScreen"
import {useState, useEffect} from 'react'
import {io} from 'socket.io-client'
import {Outlet, useNavigate, Route, Routes } from "react-router-dom";

function App() {
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate()

  useEffect(() => {
      const url = process.env.REACT_APP_API_URL
      const newSocket = io.connect(url);
      setSocket(newSocket);
      document.title = "Puzzle With Friends"
      return () => newSocket.close();
  }, [setSocket]);

  function Home(){
    return(
          <div>
            <header className="App-header">
              <img src={logo} className="App-logo" alt="logo" />
              <p>
                Puzzle with friends
              </p>
              <Container className='buttonStyleContainer'>
                <Button onClick={() => {navigate("/create")}}>Create new game</Button>
                <Col></Col>
                <Button onClick={() => {navigate("/join")}}>Join a game</Button>
              </Container>
              </header>
            </div>
    )
  }

  return (
    <div className="App">
        <Routes>
          <Route path="/*" element={<Home/>}/>
          {socket && <Route path="create" element={<CreateScreen socket={socket}/>}/>}
          {socket && <Route path="join" element={<JoinScreen socket={socket}/>}/>}  
          {socket && <Route path="game" element={<GameScreen socket={socket}/>}/>}  
        </Routes>
      <Outlet />

    </div>
  );
}

export default App;
