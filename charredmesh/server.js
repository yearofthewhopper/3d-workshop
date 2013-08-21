var express 	= require('express');
var http 		= require('http');
var THREE 		= require("three");

var app 		= express();
var httpServer 	= http.createServer(app);
var socketio 	= require('socket.io').listen(httpServer);


app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

httpServer.listen(7777);

socketio.enable('browser client minification');
socketio.enable('browser client etag');
socketio.enable('browser client gzip');

function makeGameState() {
  return {
    worldBounds: new THREE.Vector3(1028, 1028, 1028),
    players: []
  };
}

var gameState = makeGameState();

function makePlayerPosition() {
  return new THREE.Vector3(
    Math.random() * gameState.worldBounds[0], 
    Math.random() * gameState.worldBounds[0],
    0);
}

function makePlayer(socket) {
  return {
    id: socket.id,
    socket: socket,
    position: makePlayerPosition()
  }
}

function serializePlayer(player) {
  return {
    id: player.id,
    position: player.position.toArray()
  }
}

function serializeGameState(gameState) {
  return {
    worldBounds: gameState.worldBounds.toArray(),
    players: gameState.players.map(serializePlayer)
  }
}

socketio.sockets.on('connection', function (socket) {
  var player = makePlayer(socket);
  gameState.players.push(player);
  socket.emit('gameState', serializeGameState(gameState));
  socket.broadcast.emit('playerJoin', serializePlayer(player));
});

