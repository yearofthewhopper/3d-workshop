var renderer, camera;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

var controls;
var clock;

var ground, groundGeometry, groundMaterial;
var socket, gameState;

var entities = {};


function mapObject(f, m) {
  var out = {};
  for (var key in m) {
    if (m.hasOwnProperty(key)) {
      out[key] = f(m[key], key);
    }
  }

  return out;
}

function updateGameState(obj){

  // assume they all died.
  mapObject(function(obj){
    obj.alive = false;
  }, entities);

  mapObject(function(item, id){
    if(!entities[id]){
      console.log("ADDING ENTITY: " + id);
      entities[id] = new Snockets.Entity(id);
      entities[id].deserialize(item);
      scene.add( entities[id].createObj() );
    } else {
      entities[id].deserialize(item);
    }
    entities[id].alive = true;
  }, obj);

  // assume they all died.
  mapObject(function(obj, id){
    if(!obj.alive){
      console.log("KILLING ENTITY: " + id);
      scene.remove(entities[id].obj);
      delete entities[id];
    }
  }, entities);
}


function initSocket() {
  socket = io.connect();

  socket.on('welcome', function(data) {
  });

  socket.on(Snockets.Message.UPDATE, updateGameState);
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
 /* groundMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: THREE.ImageUtils.loadTexture("textures/dirt.jpg")
  });
  
  groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 4, 4 );
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
  // rotate the ground plane so it's horizontal
  ground.rotation.x = -Math.PI * 0.5;

  scene.add(ground);*/
}

function init(){
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

function animate() {
  requestAnimationFrame(animate);
  render();
}


function render() {
  var delta = clock.getDelta();
  time += delta;
  
  controls.update();
  if(socket.socket.connected){
    mapObject(function(item){
      item.tick(delta);
      item.updateObj();
    }, entities);
  } else {

  }

  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
