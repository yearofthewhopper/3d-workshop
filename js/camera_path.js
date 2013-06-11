
var renderer, camera;
var cameraDistance;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse;

var clock = new THREE.Clock();

var splineProgress = 0;
var cameraPath;

function init() {
  element = document.getElementById('workshop');
  scene = new THREE.Scene();
  ambient = new THREE.AmbientLight(0x001111);
  scene.add(ambient);

  point = new THREE.PointLight(0xffffff);
  point.position.set(10, 10, 10);
  scene.add(point);

  mouse = new THREE.Vector2(0, 0);
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  cameraDistance = 200;
  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
  camera.position.z = cameraDistance;
  camera.lookAt(scene.position);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  element.appendChild(renderer.domElement);

  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('resize', onResize, false);

  makeStuff();
  makeCameraPath();
}

function makeCameraPath(){
  cameraPath = new THREE.Spline( [
    new THREE.Vector3( 0, 100, 100 ),
    new THREE.Vector3( 50, 100, 0 ),
    new THREE.Vector3( 100, 30, 0 ),
    new THREE.Vector3( 0, 100, - 200 )
  ]);
}

// Add a lot of cubes so there's something to see.
function makeStuff(){
  var cubeMaterial = new THREE.MeshLambertMaterial({
    color: 0x502939
  });
  for(var i = 0; i < 100; i++){     
    var cube = new THREE.CubeGeometry( 20, 20, 20 );
    var cubeMesh = new THREE.Mesh(cube, cubeMaterial);
    cubeMesh.position.set(Math.random()*400-200,Math.random()*400-200,Math.random()*400-200);
    scene.add(cubeMesh);
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

}

function onMouseDown(event) {

}

function animate() {
  var delta = clock.getDelta();

  splineProgress += delta;

  // repeat..
  if(splineProgress >= 6) {
    splineProgress = 0;
  }

  // move the camera along the spline.
  camera.position.copy( cameraPath.getPoint( splineProgress / 6 ) );

  // get a vector that is just ahead of the current spline point.
  var tmpVector = new THREE.Vector3();
  tmpVector.copy( cameraPath.getPoint((splineProgress / 6) + 0.01));

  // look at the point just ahead on the spline so the camera looks "forward" along the path.
  camera.lookAt(tmpVector);

  requestAnimationFrame(animate);
  render();
}

function render() {
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
