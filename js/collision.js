var renderer, camera;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

var controls;
var clock;

var ground, groundGeometry, groundMaterial;
var ball, ballMesh, ballGeometry, ballMaterial, ballRadius;
var ray, collision, gravity;

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
  point.position.set( -450, 450, 150 );
  point.target.position.set( 0, 0, 0 );

  // Set shadow parameters for the spotlight.
  point.castShadow = true;
  point.shadowCameraNear = 50;
  point.shadowCameraFar = 1000;
  point.shadowCameraFov = 110;
  point.shadowBias = 0.0001;
  point.shadowDarkness = 0.5;

  // Larger shadow map size means better looking shadows but impacts performance and texture memory usage.
  point.shadowMapWidth = 1024;
  point.shadowMapHeight = 1024;

  scene.add(point);
}


function initGeometry(){
  groundMaterial = new THREE.MeshLambertMaterial({
    shading: 1,
    color: 0xaaaaaa
  });
  
  groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 11, 11 );
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
  // rotate the ground plane so it's horizontal
  ground.rotation.x = Math.PI * 1.5;
  ground.position.set(15, -50, 200);
  ground.castShadow = false;
  ground.receiveShadow = true;

  scene.add(ground);

  ballRadius = 50;
  ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
  ballMaterial = new THREE.MeshLambertMaterial({
    color: 0xcc0000
  });
  ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
  ballMesh.castShadow = true;
  ball = new THREE.Object3D();
  ball.add(ballMesh);
  ball.position.set(0, 100, 100);
  ball.velocity = new THREE.Vector3(0, 0, 0);
  scene.add(ball);

  gravity = new THREE.Vector3(0, -0.1, 0);
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
}

function getVertex(plane, x, y) {
  var limit = plane.heightSegments;
  var vertexIndex = x + y * (limit + 1);
  return plane.vertices[vertexIndex];
}

function makeBump(plane, vertex, height) {
  for (var j = 0; j < plane.vertices.length; j++) {
    plane.vertices[j].z = 0;
    var distance = plane.vertices[j].distanceTo(vertex);
    var bump = height - distance;
    // plane.vertices[j].z = bump >= 0 ? bump : 0;
    plane.vertices[j].z = Math.sin(bump * 0.01) * height;
  }
  
  plane.computeFaceNormals();
  plane.computeVertexNormals();
  plane.normalsNeedUpdate = true;
  plane.verticesNeedUpdate = true;
}

function detectGround() {
  // var downwards = ball.position.clone();
  // downwards.y -= ballRadius;
  var downwards = new THREE.Vector3(0, -1, 0);
  ray = new THREE.Raycaster(ball.position.clone(), downwards);
  collision = ray.intersectObjects([ground]);
  if (collision.length > 0 && collision[0].distance < ballRadius) {
    var distance = ballRadius - collision[0].distance;
    var normal = collision[0].face.normal;
    ball.position.add(downwards.multiplyScalar(-distance));
    ball.velocity.reflect(normal);
  }
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
  makeBump(groundGeometry, new THREE.Vector3(Math.cos(time*2)*100, Math.sin(time*2)*100, 0), 100);
  detectGround();
  ball.velocity.add(gravity);
  // ball.velocity.multiplyScalar(0.99);
  ball.position.add(ball.velocity);
  renderer.render(scene, camera);
}


window.onload = function() {
  init();
  animate();
}
