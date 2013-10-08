var express = require('express');
var http = require('http');
var THREE = require("three");
var PNG = require('png-js');

var terrainData;

var MAP_DATA_WIDTH = 1024;
var MAP_DATA_HEIGHT = 1024;
var terrainHeightScale = 1.5;
var SEA_LEVEL = 0;
var terrainResolution = 16;

PNG.decode('public/textures/terrain_height_map_mars2.png', function(pixels) {
    // pixels is a 1d array of decoded pixel data
    console.log("Loaded map data!");
    
    var count = MAP_DATA_WIDTH * MAP_DATA_HEIGHT;
    terrainData = new Buffer(count);

    for(var i = 0; i < count; i++){
      terrainData[i] = pixels[i*4];
    }
   // console.log(terrainData.toString("base64").length);
});

var app = express();
var httpServer = http.createServer(app);
var socketio = require('socket.io').listen(httpServer);

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

app.get("/terrain", function(req, res){
  
  var chunkSize = 32;

  var x = Number(req.query.x);// * chunkSize;
  var z = Number(req.query.z);// * chunkSize;
  
  var dataX = x * chunkSize;
  var dataZ = z * chunkSize;
  chunkSize++;
  var data = new Buffer(chunkSize * chunkSize);
  //console.log("Chunk:" + x + "," + z);
  for(var i = 0; i < chunkSize; i++){
    //console.log("Data Z:" + (dataZ+i));
    var srcOffset = (dataX) + ((dataZ+i)*MAP_DATA_WIDTH);
    terrainData.copy( data, chunkSize * i, srcOffset, srcOffset + chunkSize );
  }

  var response = {
    chunk : x + "_" + z,
    data : data.toString("base64")
  };

  res.end(JSON.stringify(response));
});

app.get("/terrain-all", function(req, res){
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
var maxHealth = 100;
var maxDamage = 20;
var minEarthLevel = 0;
var explosionRadius = 138;

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
    worldBounds: new THREE.Vector3(4096, 1028, 4096),
    players: {},
    projectiles: {}
  };
}

var gameState = makeGameState();

function makePlayerPosition() {
  return new THREE.Vector3(
    gameState.worldBounds.x / 2, //Math.random() * gameState.worldBounds.x, 
    0,
    gameState.worldBounds.z / 2);//Math.random() * gameState.worldBounds.z);
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
    health: maxHealth,
    position: makePlayerPosition(),
    rotation: rotation,
    velocity: new THREE.Vector3(),
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
    health: player.health,
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

  var maxVelocity   = 675;
  var gravity       = 230;

  player.velocity.y -= (gravity * delta);

  if(player.position.y < SEA_LEVEL){
    player.velocity.x *= 0.55;
    player.velocity.z *= 0.55;
  } else{
    player.velocity.x *= 0.75;
    player.velocity.z *= 0.75;
  }
  
  var tmp = player.position.clone();

  player.position.add(player.velocity.clone().multiplyScalar(delta));
    
  if(player.velocity.length() > maxVelocity){
    player.velocity.setLength(maxVelocity);
  } 

  var ground = getGroundHeight(player.position.x, player.position.z);
  if(player.position.y < ground){

    player.position.y = ground;
    player.velocity.y = 0;

   
  }
   if (player.input.forward) {
      player.velocity.add(player.orientation.clone().multiplyScalar(forwardDelta))
    }
  
    if (player.input.back) {
      player.velocity.sub(player.orientation.clone().multiplyScalar(forwardDelta));
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
  return projectile.position.y <= getGroundHeight(projectile.position.x,projectile.position.z) || projectile.position.y < minEarthLevel;
}

function removeProjectile(projectile) {
  delete gameState.projectiles[projectile.owner];
  broadcast("projectileExplode", projectile.owner);
}

function collidesWithPlayer(projectile) {
  var collision = projectile.position.clone();
  collision.y += playerHeight * 0.5;
  for (var id in gameState.players) {
    if (gameState.players.hasOwnProperty(id)) {
      var distance = gameState.players[id].position.distanceTo(collision);
      if (distance < playerHeight * 0.5) return true;
    }
  }
}

function projectileDamage(projectile) {
  var collision = projectile.position.clone();
  collision.y += playerHeight * 0.5;
  mapObject(function(player) {
    var distance = player.position.distanceTo(collision);
    if (distance < explosionRadius) {
      player.health -= maxDamage * (1 - (distance / explosionRadius));
      player.health = Math.max(player.health, 0);
    }
  }, gameState.players);
}

function updateProjectile(projectile, delta) {
  projectile.velocity.add(gravity.clone().add(wind));
  projectile.position.add(projectile.velocity.clone().multiplyScalar(delta));
  if (collidesWithEarth(projectile) || collidesWithPlayer(projectile)) {
    projectileDamage(projectile);
    makeCrater(projectile.position, explosionRadius/1.5);
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
  return;
  var samplePos = new THREE.Vector3();
  var changeCount = 0;
  
  var gridRadius = Math.round(radius / 8);

  //console.log("grid radius:" + gridRadius);
  
  var dirtyChunks = {};

  for(var y = -gridRadius; y < gridRadius+1; y++){
    for(var x = -gridRadius; x < gridRadius+1; x++){

      var worldX = x*8;
      var worldY = y*8;

      var elevation = getGroundHeight(worldX+position.x, worldY+position.z);
      
      samplePos.set(worldX+position.x, elevation, worldY+position.z);
      
      var dst = position.distanceTo(samplePos);
      if(dst < radius) {
      
        if(dst > 0){
          var depth =  Math.cos( dst/radius * (Math.PI / 2));
          setGroundHeight(samplePos.x, samplePos.z, elevation - (depth * 50));
        } 
      }
    }
  }
}


function setGroundHeight(x, y, newHeight){
  ;
  var terrainMapWidth = MAP_DATA_WIDTH;
  var terrainMapHeight = MAP_DATA_HEIGHT;

  var tx = x / terrainResolution;
  var ty = y / terrainResolution;

  var gridX = Math.floor(tx);
  var gridY = Math.floor(ty);
  if(newHeight > 0.1){
    terrainData[(gridX + (gridY * terrainMapWidth))] = Math.floor(newHeight / terrainHeightScale);
  } else {
    terrainData[(gridX + (gridY * terrainMapWidth))] = 0.1;
  }
}

function getGroundHeight(wx, wy){

  var gx = Math.floor(wx / terrainResolution);
  var gy = Math.floor(wy / terrainResolution);

  var gx1 = gx + 1;
  var gy1 = gy + 1;

  var fracX = (wx - (gx*terrainResolution)) / terrainResolution;
  var fracY = (wy - (gy*terrainResolution)) / terrainResolution;

  var tempHeight1 = getTerrainHeight(gx,gy) * (1-fracX) + getTerrainHeight(gx1, gy) * (fracX);
  var tempHeight2 = getTerrainHeight(gx,gy1) * (1-fracX) + getTerrainHeight(gx1, gy1) * (fracX);

  return tempHeight1 * (1-fracY) + tempHeight2 * (fracY);
}

function getTerrainHeight(gridx, gridy){
  
  var terrainMapWidth = MAP_DATA_WIDTH;
  var terrainMapHeight = MAP_DATA_HEIGHT;

  var x = Math.min(MAP_DATA_WIDTH-1, gridx);
  var y = Math.min(MAP_DATA_HEIGHT-1, gridy);

  return terrainData[(x + (y * terrainMapWidth))] * terrainHeightScale;
}
