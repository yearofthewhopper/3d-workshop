var express = require('express');
var http = require('http');
var THREE = require("three");
var PNG = require('png-js');
var Util = require("./public/js/utils.js");
var Terrain = require("./public/js/terrain.js", "three");
var nameData = require("./public/js/names.js");

var terrainData;
var terrain = new Terrain(Util, THREE);

var SEA_LEVEL       = 40;

var forwardDelta    = 120;
var rotationDelta   = 1;
var turretDelta     = 1;
var turretMax       = Math.PI * 0.5;
var turretMin       = 0;
var basePower       = 1000;
var gravity         = new THREE.Vector3(0, -20, 0);
var wind            = new THREE.Vector3(0, 0, 0);
var turretLength    = 50;
var playerHeight    = 20;
var maxHealth       = 100;
var maxDamage       = 50;
var minEarthLevel   = 0;
var explosionRadius = 450;

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

var colorPool = [];
var colorPoolLength = 20;
var colorPoolIndex = Math.floor(Math.random() * colorPoolLength);

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

function makeGameState() {
  for (var c = 0; c < colorPoolLength; c++) {
    var color = new THREE.Color().setHSL(c / colorPoolLength, 0.5, 0.5);
    colorPool.push(color);
  }

  // colorPool.sort(function(a, b) {return Math.random() < 0.5 ? -1 : 1});

  return {
    worldBounds: new THREE.Vector3(terrain.worldUnitsPerDataPoint * 1024, 1028, terrain.worldUnitsPerDataPoint * 1024),
    players: {},
    projectiles: {},
    colorPool: colorPool
  };
}

var gameState = makeGameState();

function makePlayerPosition() {
  return new THREE.Vector3(
    Math.random() * gameState.worldBounds.x * 0.25 + gameState.worldBounds.x * 0.5,
    0,
    Math.random() * gameState.worldBounds.z * 0.25 + gameState.worldBounds.z * 0.5);
}

function randomNormal() {
  return new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
}

function setOrientationFromRotation(orientation, rotation) {
  orientation.set(Math.sin(rotation), 0, Math.cos(rotation));
  return orientation;
}

function randomElement(a) {
  var index = Math.floor(Math.random() * a.length);
  return a[index];
}

function randomName() {
  var colorName = randomElement(Object.keys(colorNames));
  return {
    name: colorName + " " + randomElement(animalNames),
    color: colorNames[colorName]
  };
}

function makePlayer(socket) {
  var rotation = Math.random() * 2 * Math.PI;
  //var orientation = setOrientationFromRotation(new THREE.Vector3(), rotation);
  var turretAngle = 0;
  var name = randomName();
  // var colorIndex = colorPoolIndex++;
  // var color = colorPool[(colorPoolIndex*11) % colorPool.length]

  return {
    id: socket.id,
    alive:true,
    respawnTimer:0,
    score:0,
    socket: socket,
    health: maxHealth,
    position: makePlayerPosition(),
    rotation: rotation,
    velocity: new THREE.Vector3(),
    up: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    barrelDirection: new THREE.Vector3(),
    orientation: new THREE.Quaternion(),
    turretAngle: turretAngle,
    turretRotation: 0,
    input: playerInput(),
    name: name.name,
    color: name.color,

    // color: "#" + color.getHexString(),
    isDriving: false
  }
}

function makeProjectile(owner, position, direction, power) {

  return {
    id: owner,
    owner: owner,
    position: position,
    velocity: direction.clone().multiplyScalar(power),
    bounces : 0,
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
    turretAngle: player.turretAngle,
    name: player.name,
    color: player.color,
    alive: player.alive,
    respawn: player.respawnTimer,
    score: player.score,
    driving: player.isDriving,
    turretRotation: player.turretRotation,
    barrelDirection: player.barrelDirection.toArray(),
    up : player.up.toArray(),
    forward : player.forward.toArray(),
    orientation: player.orientation.toArray()
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

  socket.on('playerFire', function(params) {
    if (player.alive && !gameState.projectiles[player.id]) {
      
      /*
      var direction = zAxis.clone();
      direction.applyAxisAngle(xAxis, -player.turretAngle);
      direction.applyAxisAngle(yAxis, player.rotation);
      */

      var direction = player.barrelDirection.clone();

      var position = player.position.clone();
      position.y += playerHeight;
      position.add(direction.clone().multiplyScalar(turretLength));
      var projectile = makeProjectile(
        player.id, 
        position,
        direction,
        basePower + (params.power * basePower)
      );

      gameState.projectiles[player.id] = projectile;
      broadcast('projectileAppear', serializeProjectile(projectile));
    }
  });

  socket.on('disconnect', function() {
    console.log("Player disconnected!");
    delete gameState.players[player.id];
    delete gameState.projectiles[player.id];
    broadcast('playerDisconnect', player.id);
  });
});

function updatePlayer(player, delta) {

  if(player.alive && (player.health <= 0)){
    // dead.
    player.alive = false;
    player.respawnTimer = 5;
    socketio.sockets.emit("playerDied", player.id);
  } 

  if(player.alive){

    var maxVelocity   = 675;

    var impulse = new THREE.Vector3();

    if (player.input.left) {
      player.rotation += delta * rotationDelta;
      //setOrientationFromRotation(player.orientation, player.rotation);
    }

    if (player.input.right) {
      player.rotation -= delta * rotationDelta;
      //setOrientationFromRotation(player.orientation, player.rotation);
    }

    if(player.input.turretLeft){
      player.turretRotation += delta * 1;
    }
    if(player.input.turretRight){
      player.turretRotation -= delta * 1;
    }
    
    if(player.velocity.length() > maxVelocity){
      player.velocity.setLength(maxVelocity);
    }    

    var thrust = new THREE.Vector3();
    
    var ground = terrain.getGroundHeight(player.position.x, player.position.z);
    var onGround = (player.position.y - ground) < 0.25;
    
    player.isDriving = (player.input.forward || player.input.back) && (onGround);
    
    if(onGround) {

      var UP = new THREE.Vector3(0, 1, 0);
      var directionQuat = new THREE.Quaternion();
      directionQuat.setFromAxisAngle(UP, player.rotation);
      var norm = terrain.getGroundNormal(player.position.x, player.position.z);
      norm.normalize();

      player.up.copy(norm);

      var angle = UP.angleTo(norm);
      var axis = UP.clone().cross(norm);
      player.forward.set(0, 0, 1);

      normQuat = new THREE.Quaternion();
      normQuat.setFromAxisAngle(axis, angle);
      normQuat.normalize();
      directionQuat.normalize();
     
      player.forward.applyQuaternion( normQuat.multiply(directionQuat) );

      if (player.input.forward) {
        thrust.copy( player.forward.clone().multiplyScalar(forwardDelta) );
      }

      if (player.input.back) {
        thrust.copy( player.forward.clone().multiplyScalar(forwardDelta * 0.5).negate() );
      }

      if(player.position.y < SEA_LEVEL){
        thrust.multiplyScalar(0.75);
      }

      var up = new THREE.Vector3(0,1,0);
      var normal = terrain.getGroundNormal(player.position.x, player.position.z);
      var slope = normal.dot(up);

      // limit movement on slopes (and slide down)
      if(slope < 0.85 && onGround){

        slope = (slope / 0.85);
        var slide = terrain.getGroundNormal(player.position.x, player.position.z).cross(up);
        slide = slide.cross(normal);

        var resistance = slide.dot(player.forward);
        
        
        thrust.multiplyScalar(1 - resistance);
        thrust.sub( slide.multiplyScalar((1 - slope) * forwardDelta));
      }

      var turretAngle = player.turretRotation;
    
    var targetOrientationMatrix = new THREE.Matrix4().makeRotationAxis(player.up.clone().normalize().negate(), player.rotation);

    var targetOrientation = new THREE.Quaternion().setFromRotationMatrix(targetOrientationMatrix);
    //console.log(targetOrientation.toArray());
    //player.orientation.slerp(targetOrientation, 0.2);
   // player.orientation.normalize();
    player.orientation.copy(targetOrientation);
    
    player.barrelDirection.copy( player.forward );
    player.barrelDirection.applyAxisAngle( player.up, turretAngle );
    
    var barrelAxis = player.up.clone().cross( player.barrelDirection );

    player.barrelDirection.applyAxisAngle( barrelAxis, -player.turretAngle );
      
      impulse.add(thrust);
    }

 
    //player.barrelDirection.copy( player.forward );
    //console.log(player.barrelDirection.toArray());
    //player.barrelDirection.

    
    player.velocity.add(impulse);
    player.velocity.add(gravity);

    if(onGround) {
      player.velocity.x *= 0.65;
      player.velocity.z *= 0.65;
    }

    player.position.add(player.velocity.clone().multiplyScalar(delta));

    ground = terrain.getGroundHeight(player.position.x, player.position.z);
    
    if(player.position.y < ground){
      player.position.y = ground;
      player.velocity.y = 0;
    }


    if (player.input.up) {
      player.turretAngle = Math.min(turretMax, player.turretAngle + delta * turretDelta);
    }

    if (player.input.down) {
      player.turretAngle = Math.max(turretMin, player.turretAngle - delta * turretDelta);
    }

  } else {
    // player is dead.. count-down to respawn.
    player.respawnTimer -= delta;
    if(player.respawnTimer <= 0){
      respawnPlayer(player);
    }
  }

  
}

function respawnPlayer(player){
  player.alive = true;
  player.health = 100;
  player.position.set(
    Math.random() * gameState.worldBounds.x * 0.25 + gameState.worldBounds.x * 0.5,
    0,
    Math.random() * gameState.worldBounds.z * 0.25 + gameState.worldBounds.z * 0.5);

  socketio.sockets.emit("playerSpawned", serializePlayer(player));

}

function collidesWithEarth(projectile) {
  return projectile.position.y <= terrain.getGroundHeight(projectile.position.x, projectile.position.z) || projectile.position.y < minEarthLevel;
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
      if(gameState.players[id].alive){
        var distance = gameState.players[id].position.distanceTo(collision);
        if (distance < playerHeight * 0.5) return true;
      }
    }
  }
}

function projectileDamage(projectile) {
  var collision = projectile.position.clone();
  collision.y += playerHeight * 0.5;
  
  mapObject(function(player) {
    if(player.alive){
      var distance = player.position.distanceTo(collision);
      
      if (distance < explosionRadius) {
        player.health -= maxDamage * (1 - (distance / explosionRadius));
        player.health = Math.max(player.health, 0);
        
        if(player.health <= 0){
          if(player.id == projectile.owner) {
            gameState.players[projectile.owner].score -= 5;
          } else {
            gameState.players[projectile.owner].score++;
          }
        }
      }
    }
  }, gameState.players);
}

function updateProjectile(projectile, delta) {

  projectile.velocity.add(gravity.clone().add(wind));
  projectile.position.add(projectile.velocity.clone().multiplyScalar(delta));

  var groundHeight = terrain.getGroundHeight(projectile.position.x, projectile.position.z);
  
  if(projectile.position.y < 0 || projectile.position.y < groundHeight) {
    var normal = terrain.getGroundNormal(projectile.position.x, projectile.position.z);

    projectile.position.y = groundHeight;
    projectile.velocity.reflect( normal );
    projectile.velocity.negate();
    console.log("Post-reflect:", projectile.velocity.toArray() );
    projectile.velocity.multiplyScalar(0.6);
    
    projectile.bounces++;
  }

  if(projectile.bounces > 0){
     projectile.position.y = Math.max(groundHeight + 1, projectile.position.y);
     projectileDamage(projectile);
     makeCrater(projectile.position, explosionRadius / 1.5);
     removeProjectile(projectile);
  }
  /*
   if (collidesWithEarth(projectile) || collidesWithPlayer(projectile)) {
    projectileDamage(projectile);
    makeCrater(projectile.position, explosionRadius / 1.5);
    removeProjectile(projectile);
  }
  */
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
  
  var gridRadius = Math.round(terrain.worldToTerrain(radius));

  var dirtyChunks = {};

  var dx = Math.floor(terrain.worldToTerrain(position.x) - gridRadius);
  var dy = Math.floor(terrain.worldToTerrain(position.z) - gridRadius);
  var dw = Math.floor(terrain.worldToTerrain(radius*2));
  var dh = dw;

  if( (dx < 0) || ((dx+dw) >= terrain.terrainDataWidth) || (dy < 0) || ((dy+dh) >= terrain.terrainDataHeight)){
    return;
  }

  for(var y = -gridRadius; y < gridRadius+1; y++){
    var worldY = terrain.terrainToWorld(y);
    for(var x = -gridRadius; x < gridRadius+1; x++){

      var worldX = terrain.terrainToWorld(x);
      samplePos.set(worldX+position.x, terrain.getGroundHeight(worldX+position.x, worldY+position.z), worldY+position.z);
      
      var dst = position.distanceTo(samplePos);

      if(dst < radius) {
        if(dst > 0){
          var depth =  Math.cos( dst/radius * (Math.PI / 2));
          terrain.setGroundHeight(samplePos.x, samplePos.z, Math.max(0, samplePos.y - (depth * 50)));
        } 
      }
    }
  }



  var f = terrain.getDataRegion(dx,dy,dw,dh);
  terrain.updateNormals(f);
  console.log(f);
  socketio.sockets.emit("terrainUpdate", f );
  //console.log("Terrain change: " + (w*h));
}
