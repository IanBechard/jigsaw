const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);

const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.get('/api/greeting', (req, res) => {
  const name = req.query.name || 'World';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

io.on("connection", (socket) => {

});
server.listen(5000);

app.listen(3001, () =>
  console.log('Express server is running on localhost:3001')
);