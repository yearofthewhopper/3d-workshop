var express = require('express');
var http 	= require('http');
var THREE 	= require("three");
var snock = require("./public/js/networkentity.js");

var app = express();
var httpServer = http.createServer(app);
var socketio = require('socket.io').listen(httpServer);

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

httpServer.listen(7777);

socketio.enable('browser client minification');
socketio.enable('browser client etag');
socketio.enable('browser client gzip');
//socketio.set('log level', 2);


var entities = [];

socketio.sockets.on('connection', function (socket) { 
	// do stuff.
});


function updateEntities(delta){
	for(var i = 0; i < entities.length; i++){
		entities[i].serverTick(delta);
		if(!entities[i].alive) {
			entities.splice(i, 1);
			i--;
		}
	}
}


function serializeEntities(){
	var data = {};
	for(var i = 0; i < entities.length; i++){
		data[entities[i].id] = entities[i].serialize();
	}
	
	return data;
}

function updateGame(delta){
	if(Math.random() > 0.35){
    	for(var i = 0; i < 1; i++){
			var ent = new snock.Entity()
			
			ent.velocity.x = Math.random() * 140;
			ent.velocity.z = Math.random() * 150;

			ent.position.x = Math.random() * -105;
			ent.position.z = Math.random() * -105;
			ent.position.y = 20 + Math.random() * 5;
			ent.color = Math.floor( Math.random() * 0xffffff);
			entities.push(ent);
		}
    }

    updateEntities(delta);
}


function startGameLoop() {
  
  var previousTime = new Date().getTime();
  var time = previousTime;
  var delta = 0;

  setInterval(function() {
    previousTime = time;
    time = new Date().getTime();
    delta = (time - previousTime) * 0.001;   
    
    updateGame(delta);
    socketio.sockets.emit(snock.Message.UPDATE, serializeEntities());
  }, 32);
}

startGameLoop();