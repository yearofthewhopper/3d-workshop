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
//var terrainResolution = 16;
//var terrainHeightScale = 1.5;
var terrainMaterial;
var rendering = false;
var chunkUpdateCount = 0;

var particleGroups = {}

var terrain = new charredmesh.Terrain();

var cube1, cube2;

var HUD = {};

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
  newPlayer.obj.eulerOrder = "YZX";
  
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
      obj : overlay
    };
  }

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
    blending:THREE.AdditiveBlending
  });
  
  var radarMesh = new THREE.Mesh(overlaygeom, overlaymaterial);
  
  radarMesh.position.set( 50,0,-150 );
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

  var radarRange = 3000;
  var radarCanvasScale = (radarRange * 2) / HUD.radar.canvas.width;

  var ctx = HUD.radar.canvas.getContext("2d");
  ctx.clearRect(0,0,HUD.radar.canvas.width, HUD.radar.canvas.height);
  ctx.fillStyle = "rgba(0, 160, 0, 0.35)";
  ctx.fillRect(0, 0, HUD.radar.canvas.width, HUD.radar.canvas.height);
  HUD.radar.texture.needsUpdate = true;

  var currentPlayer = players[playerId];

  ctx.save();
  ctx.translate(HUD.radar.canvas.width/2, HUD.radar.canvas.height/2);
  //console.log(currentPlayer.obj.rotation.y);
  ctx.rotate( currentPlayer.obj.rotation.y - Math.PI );
  
  ctx.fillStyle = "rgba(0, 255, 0, 0.75)";
  ctx.fillRect(-5,-5, 10, 10);
  mapObject(function(player) {
    var distance = currentPlayer.obj.position.distanceTo( player.obj.position );

    if(distance < radarRange) {
      //var dotX = 
      var dotX = player.obj.position.x - currentPlayer.obj.position.x;
      var dotY = player.obj.position.z - currentPlayer.obj.position.z;
      dotX /= radarCanvasScale;
      dotY /= radarCanvasScale;
      ctx.fillRect(dotX-5,dotY-5, 10, 10);
    }
  }, players);
  ctx.restore();

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
  var healthbar = document.getElementById("health");
  var healthColor = interpolateColor(maxHealthColor, minHealthColor, health * 0.01);
  healthbar.style.width = "" + health + "%";
  healthbar.style.backgroundColor = healthColor.getStyle();
}

function updatePlayer(player) {
  players[player.id].obj.position.fromArray(player.position);

  if(players[player.id].overlay){
    players[player.id].overlay.obj.position.fromArray(player.position);
    players[player.id].overlay.obj.position.y += 50;
  }


  players[player.id].obj.rotation.y = player.rotation;
  players[player.id].turret.rotation.x = -player.turretAngle;

  var directionVector = new THREE.Vector3( Math.cos(-player.rotation+Math.PI/2), 0, Math.sin(-player.rotation+Math.PI/2) );

  var pt1 = players[player.id].obj.position.clone().add(directionVector.clone().multiplyScalar(20));
  var pt2 = players[player.id].obj.position.clone().add(directionVector.clone().multiplyScalar(-20));


  var height1 = terrain.getGroundHeight(pt1.x, pt1.z);
  var height2 = terrain.getGroundHeight(pt2.x, pt2.z);
  pt1.y = height1;
  pt2.y = height2;
  
  players[player.id].obj.rotation.x += (Math.atan((height2-height1) / 40) - players[player.id].obj.rotation.x) * 0.15;
  directionVector = new THREE.Vector3( Math.cos(-player.rotation), 0, Math.sin(-player.rotation) );

   
  players[player.id].health = player.health;
  if (player.id === playerId) {
    updateHealthBar(player.health);
    
    cube1.position.copy(pt1);
    cube2.position.copy(pt2);
  } else {
    // update UI overlay for other players.
   // players[player.id].overlay.canvas.getContext("2d");
   updateOverlay(players[player.id]);
  }
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
  controls.center.set(players[playerId].obj.position.x, players[playerId].obj.position.y, players[playerId].obj.position.z);
}

function updateTerrainChunks(){

  var terrainResolution = terrain.worldUnitsPerDataPoint;

  var viewDistanceHQ = 1000;
  var viewDistanceMQ = 2000;
  var viewDistance = 8000;

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
          addTerrainChunk(x, z, 4);
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

function getAllTerrain() {
  $.ajax("/terrain-all", {
    success:function(data){
      terrainData = Util.decodeBase64(data);
      terrain.loadBase64Data(data);
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
    
    var chunkGeometry = new THREE.TerrainGeometry(quality, chunkSize, terrain.worldUnitsPerDataPoint, data);
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


function initParticles(){

   var explostionEmitterSettings = {
      type: 'sphere',
      positionSpread: new THREE.Vector3(30, 10, 30),
      radius: 1,
      speed: 200,
      size: 30,
      sizeSpread: 30,
      sizeEnd: 0,
      opacityStart: 1,
      opacityEnd: 0,
      acceleration:new THREE.Vector3(0, -100, 0),
      colorStart: new THREE.Color('yellow'),
      colorSpread: new THREE.Vector3(0, 10, 0),
      colorEnd: new THREE.Color('red'),
      particlesPerSecond: 2000,
      alive: 0,
      emitterDuration: 0.12
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
  
  particleGroups["explosion"] = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 2.0,
    blending: THREE.AdditiveBlending
  });

  particleGroups["explosion"].addPool( 10, explostionEmitterSettings, false );
  

  particleGroups["bulletTrail"] = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 3.0,
    blending: THREE.NormalBlending,
    depthTest:true
   //depthWrite:true
  });

  particleGroups["bulletTrail"].addPool( 10, bulletTrailEmitterSettings, false );
  
    // Add particle group to scene.
  scene.add( particleGroups["explosion"].mesh );
  scene.add( particleGroups["bulletTrail"].mesh );
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

  /*explosion = new Explosion(oldProjectile.obj.position);
  scene.add(explosion.obj);
  effectQueue.push(explosion);*/


  particleGroups["explosion"].triggerPoolEmitter( 1, oldProjectile.obj.position.clone() );

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
  renderer = new THREE.WebGLRenderer( {
    clearColor: skyColor, 
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
  var oceanFragmentShader = THREE.ShaderChunk.fog_pars_fragment + document.getElementById('fragment-water').textContent;

  for(var itm in THREE.ShaderChunk) {
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
      color:0x606060,
      //map: THREE.ImageUtils.loadTexture("textures/dirt.jpg"),
      shading:THREE.FlatShading
      //wireframe:true
    });

  
  var objLoader = new THREE.OBJLoader();

  objLoader.addEventListener( 'load', function ( event ) {
    tankModel = event.content;
    tankModel.scale.set(1.1, 1.1, 1.1);
    tankModel.position.set(0, 0, 0);
 
    initSocket();
  });

  objLoader.load( "models/T72.obj" ); 



  cube1 = new THREE.Mesh(new THREE.CubeGeometry(5,5,5), new THREE.MeshBasicMaterial({color:0xff0000}));
  //scene.add(cube1);
  cube2 = new THREE.Mesh(new THREE.CubeGeometry(5,5,5), new THREE.MeshBasicMaterial({color:0x00ff00}));
  //scene.add(cube2);
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

  createHUD();

  getAllTerrain();
  
  // Socket is connected after assets are loaded.
}

function onResize() {
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();

  HUD.camera.aspect = aspecRatio;
  HUD.camera.updateProjectionMatrix();
  
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

function updateChaseCam() {

  // don't try to update the camera if the player hasn't been instantiated yet.
  if(!playerId){
    return;
  }

  var p = players[playerId].obj.position.clone();

  // find a spot above and behind the player
  p.z -= Math.cos(players[playerId].obj.rotation.y) * 300;
  p.x -= Math.sin(players[playerId].obj.rotation.y) * 300;

  // Use larger of either an offset from the players Y position, or a point above the ground.  
  // This prevents the camera from clipping into mountains.
  p.y = Math.max( terrain.getGroundHeight(p.x, p.z)+100, p.y + 100);

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

  mapObject(function(player){
   // console.log(player.obj.position.x);
    if(player.overlay){
      player.overlay.obj.lookAt(camera.position);
    }
  }, players);
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



function render() {
  var delta = clock.getDelta();
  time += delta;
  
  //controls.update();
  updateEffectQueue(delta);

  updateHUD();

  particleGroups["explosion"].tick(delta);
  particleGroups["bulletTrail"].tick(delta);
  
  renderer.clear();
  renderer.render(scene, camera);
  renderer.render(HUD.scene, HUD.camera);

  oceanUniforms.time.value += 0.01;
}

window.onload = function() {
  init();
  animate();
}
