var renderer, camera;
var cameraDistance;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

function init() {
  element = document.getElementById('workshop');
  scene = new THREE.Scene();
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

  time = 0;
  mouse = new THREE.Vector2(0, 0);
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  cameraDistance = 200;
  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
  camera.position.z = cameraDistance;
  camera.lookAt(scene.position);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;
  element.appendChild(renderer.domElement);

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('resize', onResize, false);
}

function onResize() {
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {

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
  time++;
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
