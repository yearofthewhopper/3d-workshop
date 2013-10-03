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


var skyColor = 0xcbe5ff;

var terrainData;

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
var caliber = 3;

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
    color: 0x0000FF
  });
  
  var turretgeom = new THREE.CylinderGeometry(caliber, caliber, turretLength, 16);
  var turretmesh = new THREE.Mesh(turretgeom, turretmaterial);
  turretmesh.rotation.z = Math.PI / 2;
  turretmesh.position.set(turretLength * 0.5, 0, 0);
  var turret = new THREE.Object3D();
  turret.rotation.y = -Math.PI * 0.5;
  turret.position.set(0, 20 + caliber*0.5, 0);
  turret.add(turretmesh);
  
 // var geom = new THREE.CubeGeometry(20, 20, 20);
  var tank = tankModel.clone();//= new THREE.Mesh(geom, material);
  tank.position.y += 10;
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

function updateHealthBar(health) {
  document.getElementById("health").style.width = "" + health + "%";
}

function updatePlayer(player) {
  players[player.id].obj.position.fromArray(player.position);

//  players[player.id].obj.position.y = findGround(players[player.id].obj.position.z, players[player.id].obj.position.x)+0;

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
  test();
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

  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 10000);
  camera.position.z = 0;
  camera.position.y = 1000;
  camera.lookAt(scene.position);

  // Initialize the renderer
  renderer = new THREE.WebGLRenderer({clearColor: skyColor});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;

  element = document.getElementById('viewport');
  element.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera);
  
  scene.fog = new THREE.Fog(0xcbe5ff, 800, 1700);

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

function initGeometry(){

  groundGeometry = new THREE.PlaneGeometry(4096, 4096, 512, 512);
  groundMaterial = new THREE.MeshLambertMaterial({
    color:0xffffff,
    map: THREE.ImageUtils.loadTexture("textures/dirt.jpg"),
    //shading:THREE.FlatShading
    //wireframe:true
    }
  );

  ground = new THREE.Mesh(groundGeometry, groundMaterial);

  //ground.rotation.x = THREE.Math.degToRad(-90);
 // ground.position.set(0, 0, 0);
  scene.add(ground);
  
 // groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 4, 4 );
 // ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
  // rotate the ground plane so it's horizontal
  //ground.rotation.x = -Math.PI * 0.5;

 // scene.add(ground);


  
  var objLoader = new THREE.OBJLoader();

  objLoader.addEventListener( 'load', function ( event ) {
    tankModel = event.content;
    tankModel.scale.set(0.12, 0.12, 0.12);
    tankModel.position.set(0, 0, 0);
    scene.add(tankModel);
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
  initSocket();

  getImageData("textures/terrain_height_map.png", function(imgData) {
    terrainData = [];
    var count = 512*512;
    for(var i = 0; i < count; i++){
      terrainData[i] = imgData.data[i*4];
    }

    for (var j = 0; j < groundGeometry.vertices.length; j++) {

      var tx = groundGeometry.vertices[j].x;
      var ty = groundGeometry.vertices[j].y;
      var tz = groundGeometry.vertices[j].z;


      groundGeometry.vertices[j].y = findGround(ty, tx);
      groundGeometry.vertices[j].z = tx;
      groundGeometry.vertices[j].x = ty;
    }
    
    groundGeometry.computeFaceNormals();
    groundGeometry.computeVertexNormals();
    groundGeometry.normalsNeedUpdate = true;
    groundGeometry.verticesNeedUpdate = true;
  });
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
}

function updateChaseCam(){

  if(playerId) {
    var p = players[playerId].obj.position.clone();

    // find a spot above and behind the player
    p.z -= Math.cos(players[playerId].obj.rotation.y) * 300;
    p.x -= Math.sin(players[playerId].obj.rotation.y) * 300;
    p.y += 200;

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

var buff;
function test(){
  $.ajax("/terrain",{success: function(data){
    console.log("Done!");
    buff = base64_decode_dataview(data);
   // var test = new Int16Array(data);
    //console.log(test.buffer.get(0));

    for (var j = 0; j < buff.buffer.byteLength; j++) {
      terrainData[j] = buff.getUint8(j);
    }

    for (var j = 0; j < groundGeometry.vertices.length; j++) {

      var tx = groundGeometry.vertices[j].x;
      var ty = groundGeometry.vertices[j].y;
      var tz = groundGeometry.vertices[j].z;

      groundGeometry.vertices[j].y = findGround(tx, tz);
    }

    groundGeometry.computeFaceNormals();
    groundGeometry.computeVertexNormals();
    groundGeometry.normalsNeedUpdate = true;
    groundGeometry.verticesNeedUpdate = true;
  }});
}
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

function findGround(x, y) {

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

function render() {
  var delta = clock.getDelta();
  time += delta;
  
  updateChaseCam();
  updateEffectQueue(delta);
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
