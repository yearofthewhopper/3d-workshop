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

var rotationDelta = 0.05;

function makeGameState() {
  return {
    worldBounds: new THREE.Vector3(1028, 1028, 1028),
    players: {}
  };
}

var gameState = makeGameState();

function makePlayerPosition() {
  return new THREE.Vector3(
    Math.random() * gameState.worldBounds.x - gameState.worldBounds.x * 0.5, 
    0,
    Math.random() * gameState.worldBounds.z - gameState.worldBounds.z * 0.5);
}

function randomNormal() {
  return new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
}

function makePlayer(socket) {
  return {
    id: socket.id,
    socket: socket,
    position: makePlayerPosition(),
    rotation: Math.random() * 2 * Math.PI
  }
}

var orientation = new THREE.Vector3();
function getOrientation(rotation) {
  orientation.set(Math.sin(rotation), 0, Math.cos(rotation));
  return orientation;
}

function mapObject(f, m) {
  var out = {};
  for (var key in m) {
    out[key] = f(m[key]);
  }

  return out;
}

function serializePlayer(player) {
  return {
    id: player.id,
    position: player.position.toArray(),
    rotation: player.rotation
  }
}

function serializeGameState(gameState) {
  return {
    worldBounds: gameState.worldBounds.toArray(),
    players: mapObject(serializePlayer, gameState.players)
  }
}

function broadcast(key, message) {
  mapObject(function(player) {
    player.socket.emit(key, message);
  }, gameState.players);
}

socketio.sockets.on('connection', function (socket) {
  var player = makePlayer(socket);
  gameState.players[player.id] = player;
  socket.emit('welcome', serializeGameState(gameState));
  socket.broadcast.emit('playerJoin', serializePlayer(player));

  socket.on('playerForward', function(socket) {
    player.position.add(getOrientation(player.rotation));
    broadcast('playerForward', serializePlayer(player));
  });

  socket.on('playerTurnLeft', function(socket) {
    player.rotation += rotationDelta;
    broadcast('playerTurnLeft', serializePlayer(player));
  });

  socket.on('playerTurnRight', function(socket) {
    player.rotation -= rotationDelta;
    broadcast('playerTurnRight', serializePlayer(player));
  });

  socket.on('disconnect', function(socket) {
    delete gameState.players[player.id];
    broadcast('playerDisconnect', player.id);
  });
});

