var renderer, camera;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

var controls;
var clock;

var ground, groundGeometry, groundMaterial;
var socket, gameState;

var me, tank;

var players = {};

function mapObject(f, m) {
  var out = {};
  for (var key in m) {
    if (m.hasOwnProperty(key)) {
      out[key] = f(m[key]);
    }
  }

  return out;
}

function createPlayer(playerData) {
  var position = new THREE.Vector3().fromArray(playerData.position);
  var rotation = playerData.rotation;

  var newPlayer = {
    id : playerData.id
  };

  var material = new THREE.MeshBasicMaterial({
    color: 0xFF0000
  });
  
  var geom = new THREE.CubeGeometry( 20, 20, 20 );
  var cube = new THREE.Mesh(geom, material);
  cube.position.y += 10;
  newPlayer.obj = new THREE.Object3D();
  newPlayer.obj.position.copy(position);
  newPlayer.obj.rotation.y = rotation;
  newPlayer.obj.add(cube);
  
  scene.add(newPlayer.obj);
  players[newPlayer.id] = newPlayer;
}

function initSocket() {
  socket = io.connect();

  socket.on('welcome', function(data) {
    console.log('game state ', data);
    gameState = data;
    mapObject(createPlayer, gameState.players);
  });

  socket.on('playerJoin', function(data) {
    console.log('player join ', data);
    createPlayer(data);
  });
  
  socket.on('playerForward', function(player) {
    players[player.id].obj.position.fromArray(player.position);
    players[player.id].obj.rotation.y = player.rotation;
  })

  socket.on('playerTurnLeft', function(player) {
    players[player.id].obj.position.fromArray(player.position);
    players[player.id].obj.rotation.y = player.rotation;
  })

  socket.on('playerTurnRight', function(player) {
    players[player.id].obj.position.fromArray(player.position);
    players[player.id].obj.rotation.y = player.rotation;
  })

  socket.on('playerDisconnect', function(id) {
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
  camera.position.z = 400;
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

  ambient = new THREE.AmbientLight(0x001111);
  scene.add(ambient);

  point = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI, 1 );
  point.position.set( -250, 250, 150 );
  point.target.position.set( 0, 0, 0 );

  // Set shadow parameters for the spotlight.
  point.castShadow = true;
  point.shadowCameraNear = 50;
  point.shadowCameraFar = 1000;
  point.shadowCameraFov = 50;
  point.shadowBias = 0.0001;
  point.shadowDarkness = 0.5;

  // Larger shadow map size means better looking shadows but impacts performance and texture memory usage.
  point.shadowMapWidth = 1024;
  point.shadowMapHeight = 1024;

  scene.add(point);
}


function initGeometry(){
  groundMaterial = new THREE.MeshBasicMaterial({
    color: 0x808080
  });
  
  groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 4, 4 );
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
  // rotate the ground plane so it's horizontal
  ground.rotation.x = Math.PI * 1.5;
  // ground.position.set(15, -50, 200);
  ground.castShadow = false;
  ground.receiveShadow = true;

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
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
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


function onKeyDown(event) {
  switch(event.keyCode)
  {
  case 32:
    socket.emit('playerFire');
    break;
  case 87: // W
    socket.emit('playerForward');
    break;
  case 83: // S
    socket.emit('playerBackward');
    break;
  case 65: // A
    socket.emit('playerTurnLeft');
    break;
  case 68: // D
    socket.emit('playerTurnRight');
    break;
  case 82: // R
    socket.emit('playerTurretUp');
    break;
  case 70: // F
    socket.emit('playerTurretDown');
    break;
  }
}

function onKeyUp(event) {

}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  var delta = clock.getDelta();
  time += delta;
  controls.update();
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
