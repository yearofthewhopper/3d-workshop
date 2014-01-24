global.isNode = true;

var express = require('express');
var http = require('http');
var THREE = require("three");
var PNG = require('png-js');
var Util = require("./dist/server/utils.js").Util;
var Terrain = require("./dist/server/terrain.js").default;
var nameData = require("./dist/server/names.js").default;
var World = require("./dist/server/core/world.js").default;
var Player = require("./dist/server/entities/player.js").default;
var Projectile = require("./dist/server/entities/projectile.js").default;
var NetworkServer = require("./dist/server/core/network/network_server.js").default;

var terrainData;
var terrain = global.terrain = new Terrain();

var world = new World();
var network = new NetworkServer(world);

var SEA_LEVEL       = 40;

var forwardDelta    = 120;
var rotationDelta   = 1;
var turretDelta     = 1;
var turretMax       = Math.PI * 0.5;
var turretMin       = 0;
var basePower       = 1000;
var gravity         = new THREE.Vector3(0, -20, 0);
var wind            = new THREE.Vector3(0, 0, 0);
var playerHeight    = 17;
var maxHealth       = 100;
var maxDamage       = 50;
var minEarthLevel   = 0;

var animalNames = nameData.animals;
var colorNames = nameData.colors;

PNG.decode('public/textures/terrain_height_map_mountains.png', function(pixels) {
    // pixels is a 1d array of decoded pixel data
    //var count = terrain.terrainDataWidth * terrain.terrainDataHeight;
    //terrainData = new Buffer(count);
    //for(var i = 0; i < count; i++){
      //terrainData[i] = pixels[i*4];
    //}

    terrain.loadRGBA(pixels);
    console.log("Loaded map data!");
});

var app = express();
var httpServer = http.createServer(app);
var socketio = require('socket.io').listen(httpServer);

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

app.get("/terrain", function(req, res){
  
  var x = Number(req.query.x);
  var y = Number(req.query.y);

  var w = Number(req.query.w);
  var h = Number(req.query.h);
  
  var response = terrain.getDataRegion(x, y, w, h);

  res.end(JSON.stringify(response));
});


app.get("/terrain-all", function(req, res){
  res.end( terrain.getDataRegion(0,0,1024,1024).data);
});


httpServer.listen(7777);

socketio.enable('browser client minification');
socketio.enable('browser client etag');
socketio.enable('browser client gzip');
socketio.set('log level', 2);

function playerInput() {
  return {
    fire: false,
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false,
    turretLeft:false,
    turretRight:false
  };
}

var worldBounds = new THREE.Vector3(terrain.worldUnitsPerDataPoint * 1024, 1028, terrain.worldUnitsPerDataPoint * 1024);

function randomName() {
  var namedColors = Object.keys(colorNames);
  var colorName = namedColors[Math.floor(Math.random() * namedColors.length)];
  var animalName = animalNames[Math.floor(Math.random() * animalNames.length)];
  return {
    name: colorName + " " + animalName,
    color: colorNames[colorName]
  };
}


var xAxis = new THREE.Vector3(1, 0, 0);
var yAxis = new THREE.Vector3(0, 1, 0);
var zAxis = new THREE.Vector3(0, 0, 1);

socketio.sockets.on('connection', function(socket) {
  network.addConnection(socket);
  network.pushCurrentState(socket.id);

  var rotation = Math.random() * 2 * Math.PI;
  var turretAngle = 0;
  var name = randomName();
  var pos = new THREE.Vector3(
    Math.random() * (worldBounds.x * 0.6) + worldBounds.x * 0.2,
    0,
    Math.random() * (worldBounds.z * 0.6) + worldBounds.z * 0.2);

  var p = new Player({
    id: socket.id,
    health: maxHealth,
    position: pos.toArray(),
    rotation: rotation,
    turretAngle: turretAngle,
    barrelAngle: 0,
    name: name.name,
    color: name.color,
    alive: true,
    respawn: 0,
    score: 0,
    driving: false,
    barrelDirection: [0, 0, 0],
    up: [0, 0, 0],
    forward: [0, 0, 0],
  });

  world.add(p);

  socket.emit('welcome', {
    worldBounds: worldBounds.toArray(),
    id: socket.id
  });

  socket.on('ready', function() {
    network.pushCurrentState(socket.id);
  });

  socket.on('playerInput', function(input) {
    p.trigger('playerInput', input);
  });

  socket.on('playerFire', function(params) {
    p.trigger('fire', power);
  });

  socket.on('disconnect', function() {
    network.removeConnection(socket);

    var removePlayer = world.getEntity(Player, socket.id);

    if (removePlayer) {
      world.remove(removePlayer);
    }
  });
});

function startGameLoop() {
  var previousTime = new Date().getTime();
  var time = previousTime;
  var delta = 0;

  setInterval(function() {
    previousTime = time;
    time = new Date().getTime();
    delta = (time - previousTime) * 0.001;
 
    world.tick(delta);
    network.sync(delta);
  }, 32);
}

startGameLoop();
