var renderer, camera;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

var controls;
var clock;

var ground, groundGeometry, groundMaterial;
var socket, gameState;

var tank, keyboard;

var players = {};
var projectiles = {};
var playerId;
var cameraTarget = new THREE.Vector3();


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

function createPlayer(playerData) {
  var position = new THREE.Vector3().fromArray(playerData.position);
  var rotation = playerData.rotation;

  var newPlayer = {
    id: playerData.id
  };

  var material = new THREE.MeshLambertMaterial({
    color: 0xFF0000
  });
  
  var turretmaterial = new THREE.MeshLambertMaterial({
    color: 0x0000FF
  });
  
  var turretLength = 50;
  var caliber = 5;
  var turretgeom = new THREE.CubeGeometry(turretLength, caliber, caliber);
  var turretmesh = new THREE.Mesh(turretgeom, turretmaterial);
  turretmesh.position.set(turretLength * 0.5, 0, 0);
  var turret = new THREE.Object3D();
  turret.rotation.y = -Math.PI * 0.5;
  turret.position.set(0, 20 + caliber*0.5, 0);
  turret.add(turretmesh);
  
  var geom = new THREE.CubeGeometry(20, 20, 20);
  var tank = new THREE.Mesh(geom, material);
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
  var projectilematerial = new THREE.MeshBasicMaterial({
    color: 0x00FF00
  });
  var projectilegeom = new THREE.CubeGeometry(30, 30, 30);
  var projectilemesh = new THREE.Mesh(projectilegeom, projectilematerial);
  projectilemesh.position.fromArray(projectile.position);
  projectilemesh.lookAt(
    projectilemesh.position.clone().add(
      new THREE.Vector3().fromArray(projectile.velocity)));

  scene.add(projectilemesh);
  projectile.obj = projectilemesh;
  projectiles[projectile.id] = projectile;

  return projectile;
}

function updatePlayer(player) {

  players[player.id].obj.position.fromArray(player.position);
  players[player.id].obj.rotation.y = player.rotation;
  players[player.id].turret.rotation.x = -player.turretAngle;
}

function updateProjectile(projectile) {
  projectiles[projectile.id].obj.position.fromArray(projectile.position);
}

function updateGameState(state) {
  gameState = state;
  mapObject(updatePlayer, gameState.players);
  mapObject(updateProjectile, gameState.projectiles);
}

function projectileAppear(projectile) {
  createProjectile(projectile);
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

  socket.on('playerDisconnect', function(id) {
    var oldPlayer = players[id];
    var oldProjectile = projectiles[id];
    scene.remove(oldPlayer.obj);
    scene.remove(oldProjectile.obj);
    delete gameState.players[id];
    delete gameState.projectiles[id];
    delete players[id];
    delete projectiles[id];
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
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;

  element = document.getElementById('viewport');
  element.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera);
  
  time = Date.now();
}

function initLights(){

  // LIGHTS
  var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
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
  groundMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: THREE.ImageUtils.loadTexture("textures/dirt.jpg")
  });
  
  groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 4, 4 );
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
  // rotate the ground plane so it's horizontal
  ground.rotation.x = -Math.PI * 0.5;

  scene.add(ground);


  /*
  var objLoader = new THREE.OBJLoader();

  objLoader.addEventListener( 'load', function ( event ) {
    tank = event.content;
    tank.scale.set(0.25, 0.25, 0.25);
    tank.position.set(0, -50, 0);
    scene.add(tank);
  });

  objLoader.load( "models/T72.obj" );
  */
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


function render() {
  var delta = clock.getDelta();
  time += delta;
  
  updateChaseCam();
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
