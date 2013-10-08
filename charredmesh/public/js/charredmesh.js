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
var chunkSize = 32;
var terrainResolution = 16;
var terrainHeightScale = 1.5;
var terrainMaterial;
var rendering = false;
var chunkUpdateCount = 0;

var terrainChunks = {
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
    id: playerData.id,
    health: playerData.health
  };

  var material = new THREE.MeshLambertMaterial({
    color: 0xFF0000
  });
  
  var turretmaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff
  });
  
  var turretgeom = new THREE.CylinderGeometry(caliber, caliber, turretLength, 16);
  var turretmesh = new THREE.Mesh(turretgeom, turretmaterial);
  turretmesh.rotation.z = Math.PI / 2;
  turretmesh.position.set(turretLength * 0.5, 0, 0);
  var turret = new THREE.Object3D();
  turret.rotation.y = -Math.PI * 0.5;
  turret.position.set(0, 20 + caliber*0.5, 0);
  turret.add(turretmesh);
  
  //var geom = new THREE.CubeGeometry(20, 20, 20);
  //var tank = new THREE.Mesh(geom, material);
  //tank.position.y += 10;
  tank = tankModel.clone();
  newPlayer.obj = new THREE.Object3D();
  newPlayer.obj.position.copy(position);
  newPlayer.obj.rotation.y = rotation;
  newPlayer.obj.add(tank);
  newPlayer.obj.add(turret);
  newPlayer.turret = turret;
  
  scene.add(newPlayer.obj);
  players[newPlayer.id] = newPlayer;
}

function createProjectile(projectile) {
  var projectilematerial = new THREE.MeshLambertMaterial({
    color: 0xdddd00,
    emissive: 0x444400
  });
  var projectilegeom = new THREE.CylinderGeometry(0, caliber, 20, 16);
  var projectilemesh = new THREE.Mesh(projectilegeom, projectilematerial);
  var projectileobj = new THREE.Object3D();
  projectilemesh.rotation.x = Math.PI / 2;
  projectileobj.add(projectilemesh);
  projectileobj.position.fromArray(projectile.position);
  projectileobj.lookAt(
    projectileobj.position.clone().add(
      new THREE.Vector3().fromArray(projectile.velocity)));

  scene.add(projectileobj);
  projectile.obj = projectileobj;
  projectiles[projectile.id] = projectile;

  return projectile;
}

var maxHealthColor = new THREE.Color(0x00ff00);
var minHealthColor = new THREE.Color(0xff0000);

function interpolateColor(max, min, level) {
  return min.clone().lerp(max, level);
}

function updateHealthBar(health) {
  var healthbar = document.getElementById("health");
  var healthColor = interpolateColor(maxHealthColor, minHealthColor, health * 0.01);
  healthbar.style.width = "" + health + "%";
  healthbar.style.backgroundColor = healthColor.getStyle();
}

function updatePlayer(player) {
  players[player.id].obj.position.fromArray(player.position);

  players[player.id].obj.rotation.y = player.rotation;
  players[player.id].turret.rotation.x = -player.turretAngle;

  players[player.id].health = player.health;
  if (player.id === playerId) {
    updateHealthBar(player.health);
  }
}

function updateProjectile(projectile) {
  projectiles[projectile.id].obj.position.fromArray(projectile.position);
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
}

function updateTerrainChunks(){

  var viewDistanceHQ = 1500;
  var viewDistanceMQ = 3000;
  var viewDistance = 6000;

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
          //console.log("adding 1: " + x + "_" + z);
          addTerrainChunk(x, z, 1);
        }else if(dist < viewDistanceMQ){
          //console.log("adding 2: " + x + "_" + z);
          addTerrainChunk(x, z, 2);  
        }else {
          //console.log("adding 2: " + x + "_" + z);
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

function getAllTerrain(){
  $.ajax("/terrain-all", {
    success:function(data){
      //var buff = 
      //console.log(buff.buffer);
      //updateChunk(data.chunk, buff);
      terrainData = base64_decode_dataview(data);
    }
  });
}

function removeTerrainChunk(chunkId){
  if(terrainChunks.hasOwnProperty(chunkId)){
    console.log("removing chunk:" + chunkId);
    terrainChunks[chunkId].obj.geometry.dispose();
    scene.remove(terrainChunks[chunkId].obj);
    delete terrainChunks[chunkId];
  }
}

function addTerrainChunk(tx, ty, quality){
  if((tx > 31) || (tx < 0) || (ty > 31) || (ty < 0)){
    return;
  }

  var chunkId = tx+"_"+ty;
  if(!terrainChunks.hasOwnProperty(chunkId) || (terrainChunks[chunkId].lod != quality)) {
    if(terrainChunks.hasOwnProperty(chunkId) && (terrainChunks[chunkId].lod != quality)){
      console.log("quality change!")
      removeTerrainChunk(chunkId);
    }
    chunkUpdateCount++;
    var data = [];
    
    var xOffset = tx*chunkSize;
    var yOffset = ty*chunkSize;

    for(var y = 0; y < chunkSize+1; y++){
      for(var x = 0; x < chunkSize+1; x++){
        data.push( terrainData.getUint8( (xOffset+x) + ((yOffset+y) * 1024) )); 
      }
    }
    
    console.log("Adding chunk: " + chunkId + " quality:" + quality);

    var chunkGeometry = new THREE.TerrainGeometry(quality, chunkSize, data);
    var chunkMesh = new THREE.Mesh(chunkGeometry, terrainMaterial);
    chunkMesh.name = "chunk" + chunkId;
    chunkMesh.position.set(tx * chunkSize*terrainResolution, 0, ty * terrainResolution*chunkSize);
    scene.add(chunkMesh);

    terrainChunks[chunkId] = {
      lod : quality,
      obj : chunkMesh
    };
    //updateChunk(chunkId, d, quality);
  }
}




function projectileAppear(projectile) {
  createProjectile(projectile);
}

function Explosion(position) {
  var explosionmaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFF00,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
  var explosiongeom = new THREE.SphereGeometry(1, 16, 16);
  var explosionmesh = new THREE.Mesh(explosiongeom, explosionmaterial);
  explosionmesh.position = position;

  this.obj = explosionmesh;
  this.time = 0;
  this.radius = 1;
  this.opacity = 1;
  this.update = function(delta) {
    this.time += delta;
    this.radius = Math.log(this.time * 1000) * 20;

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

function projectileExplode(id) {
  var oldProjectile = projectiles[id];
  scene.remove(oldProjectile.obj);
  delete gameState.projectiles[id];
  delete projectiles[id];

  explosion = new Explosion(oldProjectile.obj.position);
  scene.add(explosion.obj);
  effectQueue.push(explosion);

  var gx = oldProjectile.obj.position.x;
  var gy = oldProjectile.obj.position.z;
 
  gx = Math.floor(gx / (chunkSize*8));
  gy = Math.floor(gy / (chunkSize*8));

  getTerrainData(gx, gy);

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
    gameState = data.state;
    mapObject(createPlayer, gameState.players);
    mapObject(createProjectile, gameState.projectiles);
    playerId = data.id;
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
    projectileExplode(id);
    var oldPlayer = players[id];
    scene.remove(oldPlayer.obj);
    delete gameState.players[id];
    delete players[id];
  });
}

function initScene() {
  clock = new THREE.Clock();
  mouse = new THREE.Vector2(0, 0);

  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  
  scene = new THREE.Scene();  

  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 22500);
  camera.position.z = 8192;
  camera.position.x = 8192;
  camera.position.y = 400;
  //camera.lookAt(new THREE.Vector3(2048,0,2048));
  //camera.target = new THREE.Vector3(2048,0,2048);

  // Initialize the renderer
  renderer = new THREE.WebGLRenderer({clearColor: skyColor, antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;

  element = document.getElementById('viewport');
  element.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera);
  controls.center.set(8192, 0, 8192);
  
  scene.fog = new THREE.Fog(skyColor, 1500, 4750);

  time = Date.now();
}

function initLights(){

  // LIGHTS
  var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.2 );
  hemiLight.color.setHSL( 0.6, 1, 0.6 );
  hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
  hemiLight.position.set( 0, 500, 0 );
  scene.add( hemiLight );

  var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  dirLight.color.setHSL( 0.1, 1, 0.95 );
  dirLight.position.set( -1, 1.75, 1 );
  dirLight.position.multiplyScalar( 50 );
  scene.add( dirLight );

  scene.add(point);
}

var oceanMaterial;
function initGeometry(){

  var oceanGeom = new THREE.PlaneGeometry(16384, 16384, 2, 2);
  /*var oceanMaterial = new THREE.MeshLambertMaterial({
    color:0x2753a5,
    transparent:true,
    opacity:0.5
  });*/


  var oceanFragmentShader = THREE.ShaderChunk.fog_pars_fragment + document.getElementById('fragment-water').textContent;

  for(var itm in THREE.ShaderChunk) {
    //console.log("//INCLUDE_CHUNK:" + itm);
    if(oceanFragmentShader.indexOf("//INCLUDE_CHUNK:" + itm) != -1) {
      console.log("SPLICING SHADER: " + itm);
      oceanFragmentShader = oceanFragmentShader.replace("//INCLUDE_CHUNK:" + itm, THREE.ShaderChunk[itm]);
    }
  }

  oceanUniforms = {
    time: { type: 'f', value: 1.0 },
    fogColor:    { type: "c", value: scene.fog.color },
    fogNear:     { type: "f", value: scene.fog.near },
    fogFar:      { type: "f", value: scene.fog.far }
  };

  oceanMaterial = new THREE.ShaderMaterial({
    uniforms: oceanUniforms,
    transparent: true,
    vertexShader: document.getElementById('vertex-passthrough').textContent,
    fragmentShader: oceanFragmentShader,
    fog:true
  });


  var ocean = new THREE.Mesh( oceanGeom, oceanMaterial );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(8192,40,8192);
  scene.add(ocean);
  terrainMaterial = new THREE.MeshLambertMaterial({
      color:0xffffff,
      map: THREE.ImageUtils.loadTexture("textures/dirt.jpg")
     // sides:THREE.DoubleSide
      //shading:THREE.FlatShading
      //wireframe:true
    });
  /*groundGeometry = new THREE.PlaneGeometry(4096, 4096, 256, 256);
  groundMaterial = new THREE.MeshLambertMaterial({
    color:0xffffff,
    map: THREE.ImageUtils.loadTexture("textures/dirt.jpg"),
    //shading:THREE.FlatShading
    //wireframe:true
    }
  );

  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.frustumCulled = false;
  scene.add(ground);*/
  
  var objLoader = new THREE.OBJLoader();

  objLoader.addEventListener( 'load', function ( event ) {
    tankModel = event.content;
    tankModel.scale.set(1.1, 1.1, 1.1);
    tankModel.position.set(0, 0, 0);
 
    initSocket();
  });

  objLoader.load( "models/T72.obj" ); 
}

function init(){
  keyboard = new KeyboardHandler(onKeyChange);
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);

  window.addEventListener('resize', onResize, false);

  initScene();
  initLights();
  initGeometry();
  getAllTerrain();
  //loadChunks();
  //initSocket();

  //getTerrainData(0, 0, 512, 512);

  /*getImageData("textures/terrain_height_map.png", function(imgData) {
    terrainData = [];
    var count = 512*512;
    for(var i = 0; i < count; i++){
      terrainData[i] = imgData.data[i*4];
    }

    for (var j = 0; j < groundGeometry.vertices.length; j++) {

      var tx = groundGeometry.vertices[j].x+2048;
      var ty = groundGeometry.vertices[j].y+2048;
      var tz = groundGeometry.vertices[j].z;

      groundGeometry.vertices[j].y = findGround(ty, tx);
      groundGeometry.vertices[j].z = tx;
      groundGeometry.vertices[j].x = ty;
    }
    
    groundGeometry.computeFaceNormals();
    groundGeometry.computeVertexNormals();
    groundGeometry.normalsNeedUpdate = true;
    groundGeometry.verticesNeedUpdate = true;
  });*/
}

function onResize() {
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
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
    if (state && !input.fire) {
      socket.emit('playerFire');
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
    input.up = state;
    break;
  case 70: // F
    input.down = state;
    break;
  }

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
  $("#stats").html(stats.join("<br>"));
}

function updateChaseCam(){

  if(playerId) {
    var p = players[playerId].obj.position.clone();

    // find a spot above and behind the player
    p.z -= Math.cos(players[playerId].obj.rotation.y) * 300;
    p.x -= Math.sin(players[playerId].obj.rotation.y) * 300;

    // SHABAM! No clipping through the ground.
    p.y = Math.max(getGroundHeight(p.x, p.z)+100, p.y + 100);

    // constantly lerp the camera to that position to keep the motion smooth.
    camera.position.lerp(p, 0.05);

    // Find a spot in front of the player
    p.copy(players[playerId].obj.position);
    p.z += Math.cos(players[playerId].obj.rotation.y) * 300;
    p.x += Math.sin(players[playerId].obj.rotation.y) * 300;

    // constantly lerp the target position too, again to keep things smooth.
    cameraTarget.lerp(p, 0.05);

    // look at that spot (looking at the player makes it hard to see what's ahead)  
    camera.lookAt(cameraTarget);
  }
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
/*
var chunkQueue = [];
function getTerrainData(x, z){
  //console.log("Get chunk:" + x + ", " + z);
  for(var i = 0; i < chunkQueue.length; i++){
    if(chunkQueue[i][2] == x+"_"+z){
      return;
    }
  }
  chunkQueue.push([x, z, x+"_"+z]);
}


function loadChunks() {
  if(chunkQueue.length > 0){

    var chunk = chunkQueue.splice(0,1);
    $.ajax("/terrain?x=" + chunk[0][0] + "&z=" + chunk[0][1],{
      success: function(json){
      
        var data = JSON.parse(json);
        //console.log(data.data);
        var buff = base64_decode_dataview(data.data);
        //console.log(buff.buffer);
        updateChunk(data.chunk, buff);

        setTimeout(loadChunks, 100);
    }});
  } else {
    setTimeout(loadChunks, 50);
  }  
}
*/





var base64_decode_dataview = (function() {
  var   __map = {}
    , __map_18 = {}
    , __map_12 = {}
    , __map_6 = {};
 
  !function() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
 
     for (var i = 0, j = chars.length, c; i < j; i ++) {
      c = chars.charAt(i);
      __map[c] = i;
      __map_18[c] = i << 18;
      __map_12[c] = i << 12;
      __map_6[c] = i << 6;
     }
  }();
 
  return function(_a, callback) {
    if (_a.indexOf('\n') !== -1)
      _a = _a.replace(/\n/g, '');
 
    var execute = function() {
      var   a = _a
        , map_18 = __map_18
        , map_12 = __map_12
        , map_6 = __map_6
        , map = __map
        , length = a.length
        , padindex = a.indexOf('=')
        , padlen = padindex > -1 ? length - padindex : 0
        , result = new DataView(new ArrayBuffer(length * 3 / 4 - padlen))
        , offset = 0
        , last = length - 4 - (length % 4);
 
      for (var i = 0, padding_length, len, n; i < length; i += 4) {
        if (i === last) {
          len = 4 - (padlen || (i + 4) - length);
          padding_length = len % 4;
 
          n = (len > 0 ? map_18[a[i + 0]] : 0) |
            (len > 1 ? map_12[a[i + 1]] : 0) |
            (len > 2 ? map_6[a[i + 2]] : 0) |
            (len > 3 ? map[a[i + 3]] : 0);
        } else {
          padding_length = 0;
          n = map_18[a[i + 0]] | map_12[a[i + 1]] | map_6[a[i + 2]] | map[a[i + 3]];
        }
 
        switch (padding_length) {
        case 0:
        case 1:
          result.setUint8(offset ++, n >>> 16);
          result.setUint8(offset ++, (n >>> 8) & 0xff);
          result.setUint8(offset ++, n & 0xff);
          break;
        case 2:
          result.setUint8(offset ++, n >>> 16);
          break;
        case 3:
          result.setUint8(offset ++, n >>> 16);
          result.setUint8(offset ++, (n >>> 8) & 0xff);
          break;
        }
      }
 
      return result;
    };
 
    if (callback) {
      setTimeout(function() {
        callback(execute());
      }, 0);
    } else {
      return execute();
    }
  };
})();

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


var MAP_DATA_WIDTH = 1024;
var MAP_DATA_HEIGHT = 1024;

function getTerrainHeight(gridx, gridy){
  
  var terrainMapWidth = MAP_DATA_WIDTH;
  var terrainMapHeight = MAP_DATA_HEIGHT;

  var x = Math.min(MAP_DATA_WIDTH-1, gridx);
  var y = Math.min(MAP_DATA_HEIGHT-1, gridy);

  return terrainData.getUint8((x + (y * terrainMapWidth))) * 1.5;
}



function render() {
  var delta = clock.getDelta();
  time += delta;
  
  //controls.update();
  updateEffectQueue(delta);
  renderer.render(scene, camera);
  oceanUniforms.time.value += 0.01;
}

window.onload = function() {
  init();
  animate();
}
