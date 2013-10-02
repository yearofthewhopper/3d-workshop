var express = require('express');
var http = require('http');
var THREE = require("three");
var PNG = require('png-js');

var terrainData;


PNG.decode('public/textures/terrain_height_map.png', function(pixels) {
    // pixels is a 1d array of decoded pixel data
    console.log("Loaded PNG!");
    
    var count = 512*512;
    terrainData = new Buffer(count);

    for(var i = 0; i < count; i++){
      terrainData[i] = pixels[i*4];
    }
   // console.log(terrainData.toString("base64").length);
})

var app = express();
var httpServer = http.createServer(app);
var socketio = require('socket.io').listen(httpServer);

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

app.get("/terrain", function(req, res){
  res.end(terrainData.toString("base64"));
});

httpServer.listen(7777);

socketio.enable('browser client minification');
socketio.enable('browser client etag');
socketio.enable('browser client gzip');
socketio.set('log level', 2);

var forwardDelta = 60;
var rotationDelta = 1;
var turretDelta = 1;
var turretMax = Math.PI * 0.5;
var turretMin = 0;
var basePower = 1000;
var gravity = new THREE.Vector3(0, -40, 0);
var wind = new THREE.Vector3(0, 0, 0);
var turretLength = 50;
var playerHeight = 20;

function playerInput() {
  return {
    fire: false,
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false
  };
}

function makeGameState() {
  return {
    worldBounds: new THREE.Vector3(1028, 1028, 1028),
    players: {},
    projectiles: {}
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

function setOrientationFromRotation(orientation, rotation) {
  orientation.set(Math.sin(rotation), 0, Math.cos(rotation));
  return orientation;
}

function makePlayer(socket) {
  var rotation = Math.random() * 2 * Math.PI;
  var orientation = setOrientationFromRotation(new THREE.Vector3(), rotation);
  var turretAngle = 0;

  return {
    id: socket.id,
    socket: socket,
    position: makePlayerPosition(),
    rotation: rotation,
    orientation: orientation,
    turretAngle: turretAngle,
    input: playerInput()
  }
}

function makeProjectile(owner, position, direction, power) {
  return {
    id: owner,
    owner: owner,
    position: position,
    velocity: direction.clone().multiplyScalar(power),
    state: "flying"
  }
}

function mapObject(f, m) {
  var out = {};
  for (var key in m) {
    if (m.hasOwnProperty(key)) {
      out[key] = f(m[key]);
    }
  }

  return out;
}

function serializePlayer(player) {
  return {
    id: player.id,
    position: player.position.toArray(),
    rotation: player.rotation,
    turretAngle: player.turretAngle
  }
}

function serializeProjectile(projectile) {
  return {
    id: projectile.id,
    owner: projectile.owner,
    position: projectile.position.toArray(),
    velocity: projectile.velocity.toArray(),
    state: projectile.state
  }
}

function serializeGameState(gameState) {
  return {
    worldBounds: gameState.worldBounds.toArray(),
    players: mapObject(serializePlayer, gameState.players),
    projectiles: mapObject(serializeProjectile, gameState.projectiles)
  }
}

function broadcast(key, message) {
  mapObject(function(player) {
    player.socket.emit(key, message);
  }, gameState.players);
}

var xAxis = new THREE.Vector3(1, 0, 0);
var yAxis = new THREE.Vector3(0, 1, 0);
var zAxis = new THREE.Vector3(0, 0, 1);

socketio.sockets.on('connection', function (socket) {
  var player = makePlayer(socket);
  gameState.players[player.id] = player;
  socket.emit('welcome', {
    state : serializeGameState(gameState),
    id : socket.id
  });
  socket.broadcast.emit('playerJoin', serializePlayer(player));

  socket.on('playerInput', function(input) {
   // console.log("INPUT", input);
    player.input = input;
  });

  socket.on('playerFire', function() {
    if (!gameState.projectiles[player.id]) {
      var direction = zAxis.clone();
      direction.applyAxisAngle(xAxis, -player.turretAngle);
      direction.applyAxisAngle(yAxis, player.rotation);
      var position = player.position.clone();
      position.y += playerHeight;
      position.add(direction.clone().multiplyScalar(turretLength));
      var projectile = makeProjectile(
        player.id, 
        position,
        direction,
        basePower
      );

      gameState.projectiles[player.id] = projectile;
      broadcast('projectileAppear', serializeProjectile(projectile));
    }
  });

  socket.on('disconnect', function() {
    delete gameState.players[player.id];
    delete gameState.projectiles[player.id];
    broadcast('playerDisconnect', player.id);
  });
});

function updatePlayer(player, delta) {
  if (player.input.forward) {
    player.position.add(player.orientation.clone().multiplyScalar(delta * forwardDelta));
    player.position.y = getGroundHeight(player.position.x, player.position.z);
  }

  if (player.input.back) {
    player.position.sub(player.orientation.clone().multiplyScalar(delta * forwardDelta));
    player.position.y = getGroundHeight(player.position.x, player.position.z);
  }

  if (player.input.left) {
    player.rotation += delta * rotationDelta;
    setOrientationFromRotation(player.orientation, player.rotation);
  }

  if (player.input.right) {
    player.rotation -= delta * rotationDelta;
    setOrientationFromRotation(player.orientation, player.rotation);
  }

  if (player.input.up) {
    player.turretAngle = Math.min(turretMax, player.turretAngle + delta * turretDelta);
  }

  if (player.input.down) {
    player.turretAngle = Math.max(turretMin, player.turretAngle - delta * turretDelta);
  }
}

function collidesWithEarth(projectile) {
  return projectile.position.y <= getGroundHeight(projectile.position.x,projectile.position.z);
}

function removeProjectile(projectile) {
  delete gameState.projectiles[projectile.owner];
  broadcast("projectileExplode", projectile.owner);
}

function updateProjectile(projectile, delta) {
  projectile.velocity.add(gravity.clone().add(wind));
  projectile.position.add(projectile.velocity.clone().multiplyScalar(delta));
  if (collidesWithEarth(projectile)) {
    makeCrater(projectile.position, 50);
    removeProjectile(projectile);
  }
}

function updateAllProjectiles(delta) {
  mapObject(function(projectile) {
    updateProjectile(projectile, delta)
  }, gameState.projectiles);
}

function updateAllPlayers(delta) {
  mapObject(function(player) {
    updatePlayer(player, delta)
  }, gameState.players);
}

function startGameLoop() {
  var previousTime = new Date().getTime();
  var time = previousTime;
  var delta = 0;

  setInterval(function() {
    previousTime = time;
    time = new Date().getTime();
    delta = (time - previousTime) * 0.001;
    updateAllPlayers(delta);
    updateAllProjectiles(delta);
    socketio.sockets.emit('loopTick', serializeGameState(gameState));
  }, 32);
}

startGameLoop();


function makeCrater(position, radius) {
  
  var samplePos = new THREE.Vector3();
  var changeCount = 0;
  
  var gridRadius = Math.round(radius / 8);

  console.log("grid radius:" + gridRadius);

  for(var y = -gridRadius; y < gridRadius+1; y++){
    for(var x = -gridRadius; x < gridRadius+1; x++){

      var tx = x*8;
      var ty = y*8;

      var elevation = getGroundHeight(tx+position.x, ty+position.z);
      
      samplePos.set(tx+position.x, elevation, ty+position.z);
      
      var dst = position.distanceTo(samplePos);
      if(dst < 50) {
        console.log(Math.floor(samplePos.x / 8), Math.floor(samplePos.z / 8));
        setGroundHeight(samplePos.x, samplePos.z, elevation - ((1.0-(dst/50)) * 50));
        changeCount++;
        //console.log("Lowering to :" + elevation);
      }
    }
  }
 console.log(changeCount + " verteces changed");
}

function setGroundHeight(x, y, newHeight){
  var heightScale = 0.75;
  var terrainMapWidth = 512;
  var terrainMapHeight = 512;

  var tx = (x+2048) / 8;
  var ty = (y+2048) / 8;

  var gridX = Math.floor(tx);
  var gridY = Math.floor(ty);

  terrainData[(gridX + (gridY * terrainMapWidth))] = Math.floor(newHeight / heightScale);

}

function getGroundHeight(x, y) {

  var tx = (x+2048) / 8;
  var ty = (y+2048) / 8;

  var gridX = Math.floor(tx);
  var gridY = Math.floor(ty);

  var fractionX = tx - gridX;
  var fractionY = ty - gridY;

  var sample1 = getTerrainHeight(gridX, gridY);
  var sample2 = getTerrainHeight(gridX+1, gridY);
  var sample3 = getTerrainHeight(gridX, gridY+1);

  var xSlope = sample1 - sample2;
  var ySlope = sample1 - sample3;

  var heightx = sample1 - (fractionX * xSlope);
  var heighty = sample1 - (fractionY * ySlope);

  var height = (heightx + heighty) / 2;

  return height;
}

function getTerrainHeight(gridx, gridy){
  var heightScale = 0.75;
  
  var terrainMapWidth = 512;
  var terrainMapHeight = 512;

  var x = Math.min(511, gridx);
  var y = Math.min(511, gridy);

  return terrainData[(x + (y * terrainMapWidth))] * heightScale;
}