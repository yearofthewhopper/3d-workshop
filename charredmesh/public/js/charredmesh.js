var renderer, camera;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

var controls;
var clock;

var ground, groundGeometry, groundMaterial;
var socket, gameState;

var tankModel, keyboard;

var players = {};
var projectiles = {};
var playerId;
var cameraTarget = new THREE.Vector3();

var effectQueue = [];

var skyColor = 0xf3e4d3;
var oceanUniforms;

var terrainData;
var chunkSize = 64;
//var terrainResolution = 16;
//var terrainHeightScale = 1.5;

var terrainMaterial;
var terrainNormalMap;
var terrainHeightMap;

var skyDome;

var layerTextures = [];
var rendering = false;
var chunkUpdateCount = 0;

var particleGroups = {}

var terrain = new charredmesh.Terrain(Util, THREE);

var HUD = {};

var debrisGeometry;

var terrainChunks = {
};


var splashTexture;

var clientState = {
  fireTimer : 0,
  firePower : 0
};

var readyFlags = {
  terrain : false,
  geometry : false,
  audio: false
};

function mapObject(f, m) {
  var out = {};
  for (var key in m) {
    if (m.hasOwnProperty(key)) {
      out[key] = f(m[key]);
    }
  }
  return out;
}

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

var input = playerInput();
var turretLength = 50;
var caliber = 1.5;

function createPlayer(playerData) {

  var position = new THREE.Vector3().fromArray(playerData.position);
  var rotation = playerData.rotation;

  var newPlayer = {
    motorSound : charredmesh.sound.getSound("motor"),
    trackSound : charredmesh.sound.getSound("tracks"),
    rotateSound : charredmesh.sound.getSound("rotate"),
    id: playerData.id,
    health: playerData.health,
    name: playerData.name,
    color: playerData.color,
    lastPosition: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    barrelDirection: new THREE.Vector3()
  };

  newPlayer.rotateSound.gain.value = 0;

  console.log(newPlayer.name + " has entered the game!");

  var material = new THREE.MeshLambertMaterial({
    color: new THREE.Color().setStyle(newPlayer.color).offsetHSL(0,-0.2,0)
  });
  
  var turretMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color().setStyle(newPlayer.color).offsetHSL(0,-0.2,0)
  });

  var equipmentMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color().setStyle(newPlayer.color).offsetHSL(0, -0.8, 0),
    shininess:150
  });

  var tracksMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color().setStyle("#505050")
  });
  
  
  tank = tankModel.clone();
  
  console.log(tank);
  tank.traverse(function(obj){
    console.log(obj.name);
    switch(obj.name){
      case "chassis" :
        obj.material = material;
        break;
      case "turret" :
      case "turret barrel_mount":
        obj.material = turretMaterial;
        break;
      case "turret barrel_mount barrel":
      case "tracks":
        obj.material = tracksMaterial;
      break;
      case "turret equipment":
        obj.material = equipmentMaterial;
        obj.geometry.computeFaceNormals();
        obj.geometry.computeVertexNormals();
        break;
    }
  });

  newPlayer.obj = new THREE.Object3D();
 
  /*
  var lightProbe = new THREE.Mesh(
    new THREE.SphereGeometry(15,15,16,16),
    new THREE.MeshLambertMaterial()
  );
  lightProbe.position.y = 25;
  newPlayer.obj.add(lightProbe);
 */
 
  newPlayer.obj.position.copy(position);
  
  newPlayer.obj.add(tank);

  // TODO: Figure out a way to preserve the heirarchy from C4D
  var turret = tank.getObjectByName("turret");
  turret.add(tank.getObjectByName("turret barrel_mount"));
  turret.add(tank.getObjectByName("turret equipment"));
  var barrel = turret.getObjectByName("turret barrel_mount");
  barrel.add(tank.getObjectByName("turret barrel_mount barrel"));

  newPlayer.turret = turret;
  newPlayer.barrel = barrel;
 
  var emitter = particleGroups["trackDust"].getFromPool();
  emitter.position.copy(newPlayer.obj.position);
  emitter.enable();

  newPlayer.dust = emitter;
  
  
  // add the health bar to all other players
  if(newPlayer.id != playerId){
    var overlayCanvas = makeCanvas(100, 20);
    var ctx = overlayCanvas.getContext("2d");

    var overlayTexture = new THREE.Texture(overlayCanvas);
    overlayTexture.needsUpdate = true;

    var overlaygeom = new THREE.PlaneGeometry(50, 10);
    var overlaymaterial = new THREE.MeshBasicMaterial({
      map : overlayTexture,
      transparent:true
    });
    
    var overlay = new THREE.Mesh(overlaygeom, overlaymaterial);
    overlay.rotation.y = -Math.PI;
    overlay.position.y = 50;
    scene.add(overlay);

    newPlayer.overlay = {
      texture : overlayTexture,
      canvas : overlayCanvas,
      material : overlaymaterial,
      obj : overlay,
    };
  }
  


  scene.add(newPlayer.obj);
  players[newPlayer.id] = newPlayer;
}

function createProjectile(projectile) {
  var projectilematerial = new THREE.MeshLambertMaterial({
    color: players[projectile.owner].color,
    emissive: 0x222222
  });
  var projectilegeom = new THREE.CylinderGeometry(0, caliber, 20, 16);
  var projectilemesh = new THREE.Mesh(projectilegeom, projectilematerial);
  var projectileobj = new THREE.Object3D();
  projectilemesh.rotation.x = Math.PI / 2;
  projectileobj.add(projectilemesh);
  projectileobj.position.fromArray(projectile.position);

  charredmesh.sound.playSound("fire", projectileobj.position);

  projectileobj.lookAt(
    projectileobj.position.clone().add(
      new THREE.Vector3().fromArray(projectile.velocity)));

  scene.add(projectileobj);
  projectile.obj = projectileobj;
  projectiles[projectile.id] = projectile;


  var emitter = particleGroups["bulletTrail"].getFromPool();
  emitter.position.copy(projectileobj.position);
  emitter.enable();
  projectile.particleEmitter = emitter;

  return projectile;
}


function createHUD(){

  var hudScene = new THREE.Scene();
  var hudCamera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 22500);
  
  hudCamera.lookAt(new THREE.Vector3(0, 0, -1));
  var overlayCanvas = makeCanvas(512, 512);
  var ctx = overlayCanvas.getContext("2d");

  var overlayTexture = new THREE.Texture(overlayCanvas);
  overlayTexture.needsUpdate = true;

  var overlaygeom = new THREE.PlaneGeometry(50, 50);
  var overlaymaterial = new THREE.MeshBasicMaterial({
    map : overlayTexture,
    transparent:true,
    blending:THREE.AdditiveBlending,
    depthTest: false
  });
  
  var radarMesh = new THREE.Mesh(overlaygeom, overlaymaterial);
  
  radarMesh.position.set( 50, -30, -150 );
  radarMesh.rotation.y = -30 * Math.PI / 180;

  hudScene.add(radarMesh);

  HUD.scene = hudScene;
  HUD.camera = hudCamera;
  HUD.radar = {
    obj:radarMesh, 
    canvas: overlayCanvas,
    texture: overlayTexture
  };
}

function updateHUD(){
  if(!playerId){
    return;
  }

  var radarRange = 6000;
  var radarCanvasScale = (radarRange * 2) / HUD.radar.canvas.width;

  var ctx = HUD.radar.canvas.getContext("2d");
  ctx.clearRect(0,0,HUD.radar.canvas.width, HUD.radar.canvas.height);
  ctx.fillStyle = "rgba(0, 160, 0, 0.35)";

      
 // ctx.fillRect(0, 0, HUD.radar.canvas.width, HUD.radar.canvas.height);
  HUD.radar.texture.needsUpdate = true;

  var currentPlayer = players[playerId];

  ctx.save();
  ctx.translate(HUD.radar.canvas.width/2, HUD.radar.canvas.height/2);
  
  ctx.beginPath();
  ctx.arc(0, 0, (HUD.radar.canvas.width / 2), 0, 2 * Math.PI, false);
  ctx.fill();
  
  ctx.rotate( currentPlayer.rotation - Math.PI );
  
  ctx.fillStyle = "rgba(0, 255, 0, 0.75)";
  ctx.fillRect(-5,-5, 10, 10);
  
  var point = new THREE.Vector2();

  mapObject(function(player) {
    var distance = currentPlayer.obj.position.distanceTo( player.obj.position );

    if(distance < radarRange) {
      var dotX = player.obj.position.x - currentPlayer.obj.position.x;
      var dotY = player.obj.position.z - currentPlayer.obj.position.z;
      dotX /= radarCanvasScale;
      dotY /= radarCanvasScale;
      ctx.fillStyle = player.color; // "rgba(0, 255, 0, 0.75)";
      ctx.fillRect(dotX-5,dotY-5, 10, 10);
    }
    else {
      var dotX = player.obj.position.x - currentPlayer.obj.position.x;
      var dotY = player.obj.position.z - currentPlayer.obj.position.z;
      
      point.set(dotX, dotY);

      point.normalize().multiplyScalar(HUD.radar.canvas.width / 2);
      ctx.fillStyle = player.color;
      ctx.fillRect(point.x-2, point.y-2, 5, 5);
    }

  }, players);



  mapObject(function(projectile) {
    var distance = currentPlayer.obj.position.distanceTo( projectile.obj.position );

    if(distance < radarRange) {
      var dotX = projectile.obj.position.x - currentPlayer.obj.position.x;
      var dotY = projectile.obj.position.z - currentPlayer.obj.position.z;
      dotX /= radarCanvasScale;
      dotY /= radarCanvasScale;
      ctx.fillStyle = players[projectile.owner].color; // "rgba(0, 255, 0, 0.75)";
      ctx.beginPath();
      ctx.arc(dotX-5, dotY-5, 5, 0, Math.PI * 2, true);
      ctx.fill();
    }
  }, projectiles);


  ctx.restore();

  
  ctx.fillStyle = "rgba(125, 125, 125, 0.5)";
  ctx.fillRect(0, 0, HUD.radar.canvas.width, 20);
  ctx.fillRect(0, HUD.radar.canvas.height-20, HUD.radar.canvas.width, 20);
  
  if(input.fire){
    ctx.fillStyle = "rgba(255, 0, 0, 1)";
    ctx.fillRect(0, 0, HUD.radar.canvas.width * clientState.firePower, 20);
  }



  var health = players[playerId].health;
  var healthColor = interpolateColor(maxHealthColor, minHealthColor, health * 0.01);
  
  ctx.fillStyle = healthColor.getStyle();
  ctx.fillRect(0, HUD.radar.canvas.height-20, HUD.radar.canvas.width * health*0.01, 20);

  /*var lookDirection = new THREE.Vector3();
    lookDirection.copy(camera.position);
    lookDirection.sub(cameraTarget);
    lookDirection.normalize();
    lookDirection.multiplyScalar(-100);

    lookDirection*/

  //HUD.radar.obj.position.copy(lookDirection.add(camera.position));
  //HUD.radar.obj.lookAt(camera.position);
}



var maxHealthColor = new THREE.Color(0x00ff00);
var minHealthColor = new THREE.Color(0xff0000);

function interpolateColor(max, min, level) {
  return min.clone().lerp(max, level);
}

function updateHealthBar(health) {
  /*var healthbar = document.getElementById("health");
  var healthColor = interpolateColor(maxHealthColor, minHealthColor, health * 0.01);
  healthbar.style.width = "" + health + "%";
  healthbar.style.backgroundColor = healthColor.getStyle();*/
}

function updatePlayer(player) {
  //console.log(player);
  players[player.id].barrelDirection.fromArray(player.barrelDirection);
  players[player.id].obj.position.fromArray(player.position);
  if( (players[player.id].obj.position.y < 40) &&  (players[player.id].lastPosition.y > 40)){
    charredmesh.sound.playSound("splash", players[player.id].obj.position);
    var sp = new Splash({"position" : players[player.id].obj.position});
    scene.add(sp.obj);
    effectQueue.push(sp);
  }

  players[player.id].velocity = players[player.id].lastPosition.sub(players[player.id].obj.position);
  players[player.id].rotation = player.rotation;

  if(players[player.id].overlay){
    players[player.id].overlay.obj.position.fromArray(player.position);
    players[player.id].overlay.obj.position.y += 50;
  }
  
  if(players[player.id].isDriving != player.driving){
    if(player.driving){
      players[player.id].dust.enable();
    } else {
      players[player.id].dust.disable();
    }
  }

  players[player.id].turret.rotation.y = player.turretRotation;
  var motorGain = players[player.id].isDriving ? 1 : 0.4;
  var motorPitch = 0.5 + (players[player.id].velocity.length() / 10);
  motorPitch = Math.min(2.5, motorPitch);

  players[player.id].motorSound.gain.value += (motorGain - players[player.id].motorSound.gain.value) * 0.1;
  players[player.id].motorSound.playbackRate.value += (motorPitch - players[player.id].motorSound.playbackRate.value) * 0.2;
  

  var trackGain = (Math.min(players[player.id].velocity.length(), 10) / 20);
  trackGain = Math.max(trackGain, input.left || input.right ? 0.25 : 0);


  players[player.id].trackSound.gain.value += (trackGain - players[player.id].trackSound.gain.value) * 0.2;
  players[player.id].trackSound.playbackRate.value += (motorPitch - players[player.id].trackSound.playbackRate.value) * 0.2;

  players[player.id].motorSound.panner.setPosition(players[player.id].obj.position.x, players[player.id].obj.position.y, players[player.id].obj.position.z);
  players[player.id].trackSound.panner.setPosition(players[player.id].obj.position.x, players[player.id].obj.position.y, players[player.id].obj.position.z);
  players[player.id].rotateSound.panner.setPosition(players[player.id].obj.position.x, players[player.id].obj.position.y, players[player.id].obj.position.z);

  players[player.id].isDriving = player.driving;
  players[player.id].dust.position.copy(players[player.id].obj.position);

  players[player.id].score = player.score;
  players[player.id].barrel.rotation.x = -player.turretAngle;
  players[player.id].driving = player.isDriving;

  players[player.id].dust.position.copy(players[player.id].obj.position);

  var rotateGain = 0;
  if(input.turretRight || input.turretLeft || input.up || input.down){
    rotateGain = 0.3;
  }
  players[player.id].rotateSound.gain.value += (rotateGain - players[player.id].rotateSound.gain.value) * 0.3;
  players[player.id].rotateSound.playbackRate.value += ((rotateGain*6) - players[player.id].rotateSound.playbackRate.value) * 0.3;


  players[player.id].obj.up.lerp(new THREE.Vector3().fromArray(player.up), 0.2);
  players[player.id].forward.lerp(new THREE.Vector3().fromArray(player.forward), 0.2);
  players[player.id].obj.lookAt(players[player.id].forward.clone().add(players[player.id].obj.position));

  players[player.id].health = player.health;
  if (player.id !== playerId) {
    // update UI overlay for other players.
    // players[player.id].overlay.canvas.getContext("2d");
    updateOverlay(players[player.id]);
  }

  players[player.id].lastPosition.copy(players[player.id].obj.position);
}

function updateOverlay( player ){
  var canvas = player.overlay.canvas;

  var ctx = player.overlay.canvas.getContext("2d");

  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, Math.max(0, player.health/100 * canvas.width), canvas.height);
  
  player.overlay.texture.needsUpdate = true;

}



function updateProjectile(projectile) {
  projectiles[projectile.id].obj.position.fromArray(projectile.position);
  projectiles[projectile.id].particleEmitter.position.copy(projectiles[projectile.id].obj.position);
  projectiles[projectile.id].obj.lookAt(
    projectiles[projectile.id].obj.position.clone().add(
      new THREE.Vector3().fromArray(projectile.velocity)));
}

function updateGameState(state) {
  gameState = state;
  mapObject(updatePlayer, gameState.players);
  mapObject(updateProjectile, gameState.projectiles);
  updateChaseCam();
  updateTerrainChunks();
  //controls.center.set(players[playerId].obj.position.x, players[playerId].obj.position.y, players[playerId].obj.position.z);
}

function updateModifiedTerrainChunks(region){
  var id = Math.floor(region.x / chunkSize) + "_" + Math.floor(region.y / chunkSize);
  if(terrainChunks.hasOwnProperty(id)){
    terrainChunks[id].lod = -1; // mark for deletion.
  }
  id = Math.floor((region.x+region.w) / chunkSize) + "_" +  Math.floor(region.y / chunkSize);
  if(terrainChunks.hasOwnProperty(id)){
    terrainChunks[id].lod = -1; // mark for deletion.
  }
  id = Math.floor((region.x+region.w) / chunkSize) + "_" + Math.floor((region.y+region.w) / chunkSize);
  if(terrainChunks.hasOwnProperty(id)){
    terrainChunks[id].lod = -1; // mark for deletion.
  }
  id = Math.floor(region.x / chunkSize) + "_" + Math.floor((region.y+region.h) / chunkSize);
  if(terrainChunks.hasOwnProperty(id)){
    terrainChunks[id].lod = -1; // mark for deletion.
  }
}

function updateTerrainChunks(){

  var terrainResolution = terrain.worldUnitsPerDataPoint;

  var viewDistanceHQ = 1000;
  var viewDistanceMQ = 6000;
  var viewDistance = 24000;

  var playerX = players[playerId].obj.position.x;
  var playerZ = players[playerId].obj.position.z;

  var startX = Math.floor(((playerX - viewDistance) / terrainResolution) / chunkSize);
  var startZ = Math.floor(((playerZ - viewDistance) / terrainResolution) / chunkSize);

  var endX = Math.floor(((playerX + viewDistance) / terrainResolution) / chunkSize)+1;
  var endZ = Math.floor(((playerZ + viewDistance) / terrainResolution) / chunkSize)+1;

  startX = Math.max(0, startX);
  startZ = Math.max(0, startZ);

  endX = Math.min(1024 / chunkSize, endX);
  endZ = Math.min(1024 / chunkSize, endZ);

  var player = new THREE.Vector2(playerX, playerZ);
  var tile = new THREE.Vector2();

  var mapToWorld = chunkSize * terrainResolution;
  var halfTile = mapToWorld / 2;

  for(var x = startX; x < endX; x++){
    for(var z = startZ; z < endZ; z++){
      
      tile.set(x*mapToWorld+halfTile, z*mapToWorld+halfTile);
      
      var dist = tile.distanceTo(player);

      if(dist < viewDistance){

        if(dist < viewDistanceHQ){
          addTerrainChunk(x, z, 1);
        }else if(dist < viewDistanceMQ){
          addTerrainChunk(x, z, 2);  
        }else {
          addTerrainChunk(x, z, 8);
        }
      }
      
    }
  }

  for(var key in terrainChunks){
    tile.set(terrainChunks[key].obj.position.x+halfTile, terrainChunks[key].obj.position.z+halfTile);
    if(tile.distanceTo(player) > viewDistance+250) {
      removeTerrainChunk(key);
    }
  }
}

function updateTerrainNormalMap(){

  var count = 1024 * 1024 * 3;

  for(var i = 0; i < count; i += 3){
    terrainNormalMap.image.data[i] = terrain.terrainNormals[i];
    terrainNormalMap.image.data[i+1] = terrain.terrainNormals[i+1];
    terrainNormalMap.image.data[i+2] = terrain.terrainNormals[i+2];
  }

  terrainNormalMap.needsUpdate = true;

  count = 1024 * 1024 * 3;
  for(var i = 0; i < count; i++){
    terrainHeightMap.image.data[i] = terrain.terrainHeight[i];
  }
  terrainHeightMap.needsUpdate = true;
}

function getAllTerrain() {
  $.ajax("/terrain-all", {
    success:function(data){
      terrainData = Util.decodeBase64(data);
      terrain.loadBase64Data(data);
      readyFlags.terrain = true;
      checkReadyState();
      
      updateTerrainNormalMap();
    }
  });
}

function removeTerrainChunk(chunkId){
  if(terrainChunks.hasOwnProperty(chunkId)){
    terrainChunks[chunkId].obj.geometry.dispose();
    scene.remove(terrainChunks[chunkId].obj);
    delete terrainChunks[chunkId];
  }
}

function addTerrainChunk(tx, ty, quality){
  
  // TODO: refactor this.
  if((tx > 31) || (tx < 0) || (ty > 31) || (ty < 0)){
    return;
  }

  var chunkId = tx+"_"+ty;
  if(!terrainChunks.hasOwnProperty(chunkId) || (terrainChunks[chunkId].lod != quality)) {
    if(terrainChunks.hasOwnProperty(chunkId) && (terrainChunks[chunkId].lod != quality)){
      removeTerrainChunk(chunkId);
    }
    chunkUpdateCount++;
    var data = [];
    
    var xOffset = tx*chunkSize;
    var yOffset = ty*chunkSize;
    
    var max = 1023;
    var dataX = 0;
    var dataY = 0;

    for(var y = 0; y < chunkSize+1; y++){
      dataY = yOffset+y;
      for(var x = 0; x < chunkSize+1; x++){
        dataX = xOffset+x;

        if(dataX > max){
          dataX = max;
        } else if(dataX < 0){
          dataX = 0;
        }
        if(dataY > max){
          dataY = max;
        }else if (dataY < 0){
          dataY = 0;
        }
        try{
          data.push( terrain.getTerrainPoint(dataX, dataY) );
          //data.push( terrainData.getUint8( (dataX) + (dataY) * 1024 )); 
        } catch(e){
          //console.log("ERROR for coordinate: " + (dataX) + ", " + (dataY));
          return;
        }
      }
    }

    var color = 0xff0000;
    switch(quality){
      case 1:
        color = 0xff0000;
        break;
      case 2:
        color = 0x00ff00;
        break;
      case 8:
        color = 0x0000ff;
        break;
      default:
        color = 0xffffff;
        break;
    }
    
    var chunkGeometry = new THREE.TerrainGeometry(quality, chunkSize, terrain.worldUnitsPerDataPoint, data);
    //var chunkMesh = new THREE.Mesh(chunkGeometry, new THREE.MeshLambertMaterial({color:color, fog:false, emissive:color, wireframe:true}));
    var chunkMesh = new THREE.Mesh(chunkGeometry, terrainMaterial);
    chunkMesh.name = "chunk_" + chunkId;
    chunkMesh.position.set(terrain.terrainToWorld(tx * chunkSize), 0, terrain.terrainToWorld(ty * chunkSize));
    
    scene.add(chunkMesh);

    terrainChunks[chunkId] = {
      lod : quality,
      obj : chunkMesh
    };
  }
}


function projectileAppear(projectile) {
  createProjectile(projectile);
}

function Explosion(position, color) {
  var explosionmaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest:true,
    depthWrite:false
  });


  charredmesh.sound.playSound("explosion", position.clone()
    );

  var explosiongeom = new THREE.SphereGeometry(1, 16, 16);
  var explosionmesh = new THREE.Mesh(explosiongeom, explosionmaterial);
  explosionmesh.position = position;


  this.obj = explosionmesh;
  this.time = 0;
  this.radius = 1;
  this.opacity = 1;
  this.update = function(delta) {
    this.time += delta;
    this.radius = Math.log(this.time * 1000) * 40;

    if (this.time > 0.5) {
      this.opacity -= delta * 2;
    }
    this.obj.scale.set(this.radius, this.radius, this.radius);
    this.obj.material.opacity = this.opacity;


  };
  this.remove = function() {
    scene.remove(this.obj);
  };
  this.isDone = function() {
    return this.time > 1;
  };
}

function Splash(params){
  this.splashMaterial = new THREE.MeshLambertMaterial({
    map: splashTexture,
    transparent: true,
    depthWrite:false
  });

  var splashMesh = new THREE.Mesh(new THREE.PlaneGeometry(5,5), this.splashMaterial);
  
  splashMesh.position.copy(params.position);
  splashMesh.position.y = 41;
  splashMesh.rotation.x = -Math.PI / 2;
  splashMesh.rotation.z = Math.random() * Math.PI * 2;

  this.spin = (Math.random() - 0.5) * 0.02;
  this.speed = Math.random() * 5 + 10;

  this.obj = splashMesh;
  this.life = 2;

  this.update = function(delta) {
    if(this.life > 0){
      this.life -= delta;
      this.obj.scale.x += delta * this.speed * this.life;
      this.obj.scale.y += delta * this.speed * this.life;
      this.obj.rotation.z += this.spin;
      this.splashMaterial.opacity = Math.max(0,this.life / 2) * ((Math.sin(this.life * 7) + 1) / 2 + 0.3) ;
    }
  }

  this.remove = function() {
    scene.remove(this.obj);
  };

  this.isDone = function() {
    return this.life <= 0;
  };
}

function Debris(params) {
  var debrisMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color(0xffffff).offsetHSL(Math.random() * -0.125, (Math.random() - 0.5) * 0.125, 0),
    transparent:true,
    map: layerTextures[4]
  });
  
  var debrisMesh = new THREE.Mesh(debrisGeometry.children[0].geometry, debrisMaterial);
  
  debrisMesh.position.copy(params.position);
  debrisMesh.position.y -= 20;

  var launchNormal = terrain.getGroundNormal(debrisMesh.position.x, debrisMesh.position.z);
  
  this.material = debrisMaterial;
  this.obj = debrisMesh;
  this.time = 0;
  this.lifeSpan = Math.random() * 4 + 3;

  launchNormal.x += Math.random() - 0.5;
  launchNormal.y += Math.random() - 0.5;
  launchNormal.z += Math.random() - 0.5;
  launchNormal.normalize();
  this.velocity = launchNormal;
  //new THREE.Vector3(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5);

  
  
  var size = Math.random();
  this.obj.scale.multiplyScalar(size * params.size[0] + params.size[1]);
  this.velocity.normalize().multiplyScalar((1-size) * 350 + 100);

  this.angularVelocity = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
  this.angularVelocity.multiplyScalar((1.5-size) * 20);

  this.update = function(delta) {
    this.time += delta;
    
    var groundHeight = terrain.getGroundHeight(this.obj.position.x, this.obj.position.z);
    this.velocity.y -= (300 * delta);
    
    var above = this.obj.position.y > 40;

    this.obj.position.add(this.velocity.clone().multiplyScalar(delta));
    this.obj.rotation.add(this.angularVelocity.clone().multiplyScalar(delta));

    if(above && this.obj.position.y < 40){
      charredmesh.sound.playSound("splash", this.obj.position);
      var sp = new Splash({"position" : this.obj.position});
    scene.add(sp.obj);
    effectQueue.push(sp);
    }

    if(this.obj.position.y < 0 || this.obj.position.y < groundHeight) {
      var normal = terrain.getGroundNormal(this.obj.position.x, this.obj.position.z);
      this.obj.position.y = groundHeight;
      this.velocity.reflect( normal );
      this.velocity.negate();
      this.velocity.multiplyScalar(above ? 0.6 : 0.1);
      this.angularVelocity.multiplyScalar(above ? 0.76 : 0.1);

      if(this.velocity.length() > 150){

        charredmesh.sound.playSound("dirt", this.obj.position);
      }
    }
    if(this.lifeSpan - this.time < 1){
      this.material.opacity = this.lifeSpan - this.time;
    }
    
  };

  this.remove = function() {
    scene.remove(this.obj);
  };
  this.isDone = function() {
    return this.time > this.lifeSpan;
  };
}


function initParticles(){

  var explosionEmitterSettings = {
    type: 'sphere',
    positionSpread: new THREE.Vector3(30, 10, 30),
    radius: 100,
    speed: 700,
    size: 30,
    sizeSpread: 30,
    sizeEnd: 30,
    opacityStart: 1,
    opacityEnd: 0,
    acceleration:new THREE.Vector3(0, 0, 0),
    colorStart: new THREE.Color('yellow'),
    colorSpread: new THREE.Vector3(0, 10, 0),
    colorEnd: new THREE.Color('red'),
    particlesPerSecond: 2000,
    alive: 0,
    emitterDuration: 0.5
  };

  var bulletTrailEmitterSettings = {
    type: 'sphere',
    positionSpread: new THREE.Vector3(1, 1, 1),
    radius: 3,
    speed: 1,
    size: 10,
    sizeSpread: 10,
    sizeEnd: 300,
    opacityStart: 0.5,
    opacityEnd: 0,
    acceleration:new THREE.Vector3(0, 8, 0),
    accelerationSpread:new THREE.Vector3(3, 5, 3),
    colorStart: new THREE.Color('gray'),
    colorEnd: new THREE.Color('white'),
    particlesPerSecond: 50,
    alive: 0
  };

  var trackDustEmitterSettings = {
    type: 'cube',
    positionSpread: new THREE.Vector3(20, 1, 20),
    radius: 3,
    speed: 1,
    size: 40,
    sizeSpread: 15,
    sizeEnd: 200,
    opacityStart: 0.45,
    opacityEnd: 0,
    acceleration:new THREE.Vector3(0, 1, 0),
    accelerationSpread:new THREE.Vector3(1, 0, 1),
    colorStart: new THREE.Color(0xebdcb6),
    colorEnd: new THREE.Color(0xebe7dc),
    particlesPerSecond: 20,
    alive: 0
  };
  
  particleGroups["explosion"] = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 2.0,
    blending: THREE.AdditiveBlending
  });

  particleGroups["explosion"].addPool( 10, explosionEmitterSettings, false );
  

  particleGroups["bulletTrail"] = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 3.0,
    blending: THREE.NormalBlending,
    depthTest:true
    //depthWrite:true
  });

  particleGroups["bulletTrail"].addPool( 10, bulletTrailEmitterSettings, false );

  particleGroups["trackDust"] = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 1.0,
    blending: THREE.NormalBlending,
    depthTest:true
    //depthWrite:true
  });

  particleGroups["trackDust"].addPool( 20, trackDustEmitterSettings, false );
  
  // Add particle group to scene.
  scene.add( particleGroups["explosion"].mesh );
  scene.add( particleGroups["bulletTrail"].mesh );
  scene.add( particleGroups["trackDust"].mesh );
}


function projectileExplode(id) {
  if(!projectiles[id]){
    return;
  }

  var oldProjectile = projectiles[id];
  
  window.setTimeout(function() {
    oldProjectile.particleEmitter.disable();
    particleGroups["bulletTrail"].releaseIntoPool(oldProjectile.particleEmitter);  
  }, 250);

  scene.remove(oldProjectile.obj);
  delete gameState.projectiles[id];
  delete projectiles[id];

  explosion = new Explosion(oldProjectile.obj.position, players[id].color);
  scene.add(explosion.obj);
  effectQueue.push(explosion);

  var debrisCount = Math.floor(Math.random() * 5 + 10);
  for(var i = 0; i < debrisCount; i++){
    var gib = new Debris({"position":oldProjectile.obj.position, "size" : [10, 4]});
    scene.add(gib.obj);
    effectQueue.push(gib);
  }
  

  //particleGroups["explosion"].triggerPoolEmitter( 1, oldProjectile.obj.position.clone() );

  var gx = oldProjectile.obj.position.x;
  var gy = oldProjectile.obj.position.z;
  
  gx = Math.floor(gx / (chunkSize*8));
  gy = Math.floor(gy / (chunkSize*8));

  //  getTerrainData(gx, gy);

  /*
    for (var j = 0; j < groundGeometry.vertices.length; j++) {
    var dst = oldProjectile.obj.position.distanceTo(groundGeometry.vertices[j]);
    if(dst < 100) {
    groundGeometry.vertices[j].y -= (50 * ((100 - dst) / 100));
    console.log("boom");
    }
    }
    
    groundGeometry.computeFaceNormals();
    groundGeometry.computeVertexNormals();
    groundGeometry.normalsNeedUpdate = true;
    groundGeometry.verticesNeedUpdate = true;
  */
}

function initSocket() {
  socket = io.connect();

  socket.on('welcome', function(data) {
    //console.log('game state ', data);
    playerId = data.id;
    gameState = data.state;
    mapObject(createPlayer, gameState.players);
    mapObject(createProjectile, gameState.projectiles);
  });

  socket.on('playerJoin', function(data) {
    console.log('player join ', data);
    createPlayer(data);
  });
  
  socket.on('playerUpdate', updatePlayer);
  socket.on('loopTick', updateGameState);

  socket.on('projectileAppear', projectileAppear);
  socket.on('projectileExplode', projectileExplode);

  socket.on('playerDisconnect', function(id) {
    console.log("Player removed.");
    projectileExplode(id);
    var oldPlayer = players[id];
    scene.remove(oldPlayer.obj);
    scene.remove(oldPlayer.overlay.obj);
    delete gameState.players[id];
    delete players[id];
  });

  socket.on("terrainUpdate", function(region){
    terrain.setDataRegion(region);
    updateModifiedTerrainChunks(region);
    updateTerrainNormalMap();
  });

  socket.on("playerDied", function(id){
    if(id == playerId){
      // do stuff.. show score?
      //alert("YOU ARE DEAD");
    } 

    setPlayerVisibility(id, false);

    //players[id].obj.visible = false;
    
    //console.log("DEADDDDED: " + id);
  });

  socket.on("playerSpawned", function(player){
    if(playerId == player.id){
      // do stuff.. hide score?
    } 
    setPlayerVisibility(player.id, true);
  })
}

function setPlayerVisibility(id, visible){
  if(!players.hasOwnProperty(id)){
    return;
  }

  players[id].obj.traverse( function(child){
    child.visible = visible;
  });

  if(playerId != id){
    players[id].overlay.obj.visible = visible;
  }
}

function initScene() {
  clock = new THREE.Clock();
  mouse = new THREE.Vector2(0, 0);

  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  
  scene = new THREE.Scene();  

  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 30000);
  camera.position.z = 8192;
  camera.position.x = 8192;
  camera.position.y = 400;
  //camera.lookAt(new THREE.Vector3(2048,0,2048));
  //camera.target = new THREE.Vector3(2048,0,2048);

  // Initialize the renderer
  renderer = new THREE.WebGLRenderer( {
    clearColor: 0x000000, 
    antialias:true
    //precision:'highp',
    //antialias: true,
    //stencil: false,
    //premultipliedAlpha: true 
  });
  renderer.autoClear = false;
  
  renderer.sortObjects = false;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;

  element = document.getElementById('viewport');
  element.appendChild(renderer.domElement);

  //controls = new THREE.OrbitControls(camera);
  //controls.center.set(8192, 0, 8192);
  
  scene.fog = new THREE.Fog(skyColor, 4000, 9000);

  time = Date.now();
}

function initLights(){

  // LIGHTS
  var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.2 );
  hemiLight.color.setHSL( 0.6, 1, 0.6 );
  hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
  hemiLight.position.set( 0, 500, 0 );
  hemiLight.name = "sky";
  scene.add( hemiLight );

  var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  dirLight.color.setHSL( 0.1, 1, 0.95 );
  dirLight.position.set( 0.7, 0.35, 0 ).normalize();
  dirLight.position.multiplyScalar( 50 );
  dirLight.name = "sun";
  scene.add( dirLight );

  scene.add(point);
}


function loadShaderSource(scriptId){
  var source = document.getElementById(scriptId).textContent;

  for(var itm in THREE.ShaderChunk) {
    if(source.indexOf("//INCLUDE_CHUNK:" + itm) != -1) {
      console.log("INCUDING CHUNK: " + itm);
      source = source.replace("//INCLUDE_CHUNK:" + itm, THREE.ShaderChunk[itm]);
    }
  }

  return source;
}


var oceanMaterial;
function initGeometry(){
  
  splashTexture = THREE.ImageUtils.loadTexture("textures/splash.png"); 


  var oceanGeom = new THREE.PlaneGeometry(16384*10, 16384*10, 28, 28);

  oceanUniforms = {
    time: { type: 'f', value: 1.0 },
    fogColor:    { type: "c", value: scene.fog.color },
    fogNear:     { type: "f", value: scene.fog.near },
    fogFar:      { type: "f", value: scene.fog.far },
    skyColor: { type: "t", value: THREE.ImageUtils.loadTexture("textures/sky.png") },
    sunGlow: { type: "t", value: THREE.ImageUtils.loadTexture("textures/glow.png") },
    lightDirection : { type: "v3", value: scene.getChildByName("sun").position }
  };

  oceanMaterial = new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    transparent: true,
    vertexShader: loadShaderSource("vertex-passthrough"),
    fragmentShader: loadShaderSource("fragment-water"),
    fog:true
  });



  var ocean = new THREE.Mesh( oceanGeom, oceanMaterial );

 
  var seaFloor = new THREE.Mesh( oceanGeom, new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture("textures/terrain/tile_sand.png"),
    fog:true
  }) );

  seaFloor.rotation.x = -Math.PI / 2;
  seaFloor.position.y = -2.5;

  scene.add(seaFloor);
  
  ocean.rotation.x = -Math.PI / 2;


  // TODO: add dynamic sea level.
  ocean.position.set(8192, 40.5, 8192);
  ocean.name = "ocean";
  
  scene.add(ocean);
  
  var skyUniforms = {
    skyColor: { type: "t", value: THREE.ImageUtils.loadTexture("textures/sky.png") },
    sunGlow: { type: "t", value: THREE.ImageUtils.loadTexture("textures/glow.png") },
    lightDirection : { type: "v3", value: scene.getChildByName("sun").position }
  };

  skyMaterial = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: loadShaderSource("vertex-sky"),
    fragmentShader: loadShaderSource("fragment-sky"),
    transparent:true,
    depthRead:true,
    depthWrite:false
  });

  skyDome = new THREE.Mesh( new THREE.SphereGeometry( 1, 12, 12, 0, Math.PI*2, 0, Math.PI*2 ), skyMaterial );
  skyDome.scale.set(15000, 15000, 15000);
  scene.add(skyDome);
  // Terrain stuff

  layerTextures[0] = THREE.ImageUtils.loadTexture("textures/terrain/tile_rock.png");
  layerTextures[1] = THREE.ImageUtils.loadTexture("textures/terrain/tile_dirt.png");
  layerTextures[2] = THREE.ImageUtils.loadTexture("textures/terrain/tile_grass.png");
  layerTextures[3] = THREE.ImageUtils.loadTexture("textures/terrain/tile_sand.png");
  layerTextures[4] = THREE.ImageUtils.loadTexture("textures/terrain/tile_cliff.png");

  for(var i = 0; i < layerTextures.length; i++){
    layerTextures[i].wrapS = layerTextures[i].wrapT = THREE.RepeatWrapping;
  }

  terrainNormalMap = THREE.ImageUtils.generateDataTexture(1024, 1024, new THREE.Color( 0x888888 )  );
  terrainNormalMap.flipY = false;
  terrainNormalMap.needsUpdate = true;

  terrainHeightMap = THREE.ImageUtils.generateDataTexture(1024, 1024, new THREE.Color( 0x000000 )  );
  terrainHeightMap.flipY = false;
  terrainHeightMap.needsUpdate = true;

  terrainMaterial = new THREE.ShaderMaterial({
    uniforms : {
      fogColor:    { type: "c", value: scene.fog.color },
      fogNear:     { type: "f", value: scene.fog.near },
      fogFar:      { type: "f", value: scene.fog.far },

      normalmap : { type: "t", value: terrainNormalMap },
      uvOffset : { type: "v2", value: new THREE.Vector2() },
      heightmap : { type: "t", value: terrainHeightMap },
      
      tex0: { type: "t", value: layerTextures[3] },
      tex1: { type: "t", value: layerTextures[2] },
      tex2: { type: "t", value: layerTextures[1] },
      tex3: { type: "t", value: layerTextures[0] },
      
      cliffTexture: { type: "t", value: layerTextures[4] },
      lightDirection : { type: "v3", value : scene.getChildByName("sun").position },
      
      skyColor: { type: "t", value: THREE.ImageUtils.loadTexture("textures/sky.png") }
    },
    vertexShader: loadShaderSource('vertex-terrain'),
    fragmentShader: loadShaderSource('fragment-terrain'),
    //wireframe:true
    fog:true
  });

  //terrainMaterial.uniforms.uvTest.value.wrapS = terrainMaterial.uniforms.uvTest.value.wrapT = THREE.RepeatWrapping;
  

  // Player model

  var objLoader = new THREE.OBJLoader();

  objLoader.addEventListener( 'load', function ( event ) {
    tankModel = event.content;
    tankModel.scale.set(1.1, 1.1, 1.1);
    tankModel.position.set(0, 0, 0);
    
    readyFlags.geometry = true;
    checkReadyState();
  });

  objLoader.load( "models/tank_parts.obj" ); 

  var objLoader2 = new THREE.OBJLoader();
  
  objLoader2.addEventListener( 'load', function ( event ) {
    debrisGeometry = event.content;
    console.log("LOADED DEBRIS");
  });
  objLoader2.load("models/debris0.obj");
}


// check to see when all the various async stuff is done loading.
function checkReadyState(){
  var ready = true;

  mapObject(function(item){
    ready = ready && item;
  }, readyFlags);

  if(ready){
    initSocket();
  }
}

function init(){
  keyboard = new KeyboardHandler(onKeyChange);
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);

  window.addEventListener('resize', onResize, false);

  initScene();
  initLights();
  initParticles();
  initGeometry();

  charredmesh.sound.initialize(function(){
    readyFlags.audio = true;
    checkReadyState();
  });

  createHUD();

  getAllTerrain();
  
  // Socket is connected after assets are loaded.
}

function onResize() {
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();

  HUD.camera.aspect = aspectRatio;
  HUD.camera.updateProjectionMatrix();
  
  HUD.radar.obj.position.x = 40 * aspectRatio;
  HUD.radar.obj.position.y = -50 / aspectRatio;

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.set( (event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
}

function onMouseDown(event) {
}

function onKeyChange(code, state) {
  switch(code)
  {
  case 32:
    //if (state && !input.fire) {
    //  socket.emit('playerFire');
   // }
    //console.log("fire:" + state);
    if(state){
      clientState.fireTimer = time;
      // start a timer
    } else {
      

      socket.emit('playerFire', {"power" : clientState.firePower});
    }

    input.fire = state;
    return;
    break;
  case 87: // W
    input.forward = state;
    break;
  case 83: // S
    input.back = state;
    break;
  case 65: // A
    input.left = state;
    break;
  case 68: // D
    input.right = state;
    break;
  case 82: // R
  case 38: // Up arrow
    input.up = state;
    break;
  case 70: // F
  case 40: // down arrow
    input.down = state;
    break;

  case 39: // right arrow
    input.turretRight = state;
    break;
  
  case 37: // left arrow
    input.turretLeft = state;
    break;
  case 69: // e
    input.aim = state;
    break;

  }

  console.log(code);
  
  socket.emit('playerInput', input);
}

function onKeyUp(event) {

}

function animate() {
  requestAnimationFrame(animate);
  render();

  var stats = [];
  stats.push("calls: " + renderer.info.render.calls);
  stats.push("faces: " + renderer.info.render.faces);
  stats.push("vertices: " + renderer.info.render.vertices);
  stats.push("geometries: " + renderer.info.memory.geometries);
  stats.push("textures: " + renderer.info.memory.textures);
  stats.push("chunk updates: " + chunkUpdateCount);
  if(playerId){
    stats.push("Player Chunk ID: " + Math.floor((players[playerId].obj.position.x / terrain.worldUnitsPerDataPoint) / chunkSize) + "_" + + Math.floor((players[playerId].obj.position.z / terrain.worldUnitsPerDataPoint) / chunkSize));
  }

  mapObject(function(player){
    stats.push(player.name + ": " + player.score);

  }, players);

  $("#stats").html(stats.join("<br>"));
}

function updateChaseCam() {

  // don't try to update the camera if the player hasn't been instantiated yet.
  if(!playerId){
    return;
  }


  var p;

  if(input.aim){
    p = players[playerId].barrelDirection.clone().multiplyScalar(-300);
    p.add(players[playerId].obj.position);
  } else {
    p = players[playerId].obj.position.clone();
    p.z -= Math.cos(players[playerId].rotation) * 300;
    p.x -= Math.sin(players[playerId].rotation) * 300;
  }

  // find a spot above and behind the player
 
 

  // Use larger of either an offset from the players Y position, or a point above the ground.  
  // This prevents the camera from clipping into mountains.
  p.y = Math.max( terrain.getGroundHeight(p.x, p.z)+75, p.y + 50);

  // constantly lerp the camera to that position to keep the motion smooth.
  camera.position.lerp(p, 0.05);

  charredmesh.sound.setListenerPosition(camera.position, cameraTarget.clone().sub(camera.position).normalize());

  // Find a spot in front of the player

  if(input.aim){
    p.copy(players[playerId].barrelDirection);
    p.multiplyScalar(300);
    p.add(players[playerId].obj.position);
  }else{
   p.copy(players[playerId].obj.position);
   p.z += Math.cos(players[playerId].rotation) * 300;
   p.x += Math.sin(players[playerId].rotation) * 300;
  }

  // constantly lerp the target position too, again to keep things smooth.
  cameraTarget.lerp(p, input.aim ? 0.5 : 0.2);

  // look at that spot (looking at the player makes it hard to see what's ahead)  
  camera.lookAt(cameraTarget);

  mapObject(function(player){
    // console.log(player.obj.position.x);
    if(player.overlay){
      player.overlay.obj.lookAt(camera.position);
    }
  }, players);

  skyDome.position.copy(camera.position);
  skyDome.position.y = 0;
}


function updateEffectQueue(delta) {
  for (var e = 0; e < effectQueue.length; e++) {
    
    effectQueue[e].update(delta);
    
    if(effectQueue[e].isDone()) {
      effectQueue[e].remove();
      effectQueue.splice(e, 1);
      e--;
    }
  }
}


// Load pixel data from an image (asynchronously)
function getImageData(imgPath, callback) {
  var img = document.createElement('img');
  img.onload = function(){
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    callback(ctx.getImageData(0, 0, img.width, img.height));
  }
  img.src = imgPath;
}


function makeCanvas(width, height){
  var canvas = document.createElement("canvas");
  
  canvas.width = width;
  canvas.height = height;

  canvas.style.position = "absolute";
  canvas.style.zIndex = 100000;

  document.body.appendChild(canvas);

  return canvas;
}


function updateClient(delta){
  if(input.fire){
    clientState.firePower = Math.sin((time - clientState.fireTimer) + (3 * Math.PI / 2));
    clientState.firePower = (clientState.firePower + 1) / 2;
  }
}


function render() {
  var delta = clock.getDelta();
  time += delta;
  
  //scene.getObjectByName("sun").position.set( Math.cos(time * 0.1), Math.sin(time * 0.1), 0);

  //controls.update();
  updateClient(delta);
  updateEffectQueue(delta);
  updateHUD();

  particleGroups["explosion"].tick(delta);
  particleGroups["bulletTrail"].tick(delta);
  particleGroups["trackDust"].tick(delta);
  
  renderer.clear();
  renderer.render(scene, camera);
  renderer.render(HUD.scene, HUD.camera);

  oceanUniforms.time.value += 0.01;
}

window.onload = function() {
  init();
  animate();
}
