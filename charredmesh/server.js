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

var clients = [];

socketio.enable('browser client minification');
socketio.enable('browser client etag');
socketio.enable('browser client gzip');

function makeClient(socket) {
  return {
    id: socket.id,
    socket: socket
  }
}

socketio.sockets.on('connection', function (socket) {
  var client = makeClient(socket);
  clients.push(client);
  socket.broadcast.emit('new', {id: socket.id});
});