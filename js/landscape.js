var renderer, camera;
var cameraDistance;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;
var mouseX = 0;
var mouseY = 0;
var ground, groundGeometry, groundMaterial;

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
  cameraDistance = 800;
  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
  camera.position.z = cameraDistance;
  camera.position.y = 200;
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

  groundMaterial = new THREE.MeshLambertMaterial({
    // map: THREE.ImageUtils.loadTexture("img/birth.jpg"),
    shading: 1,
    color: 0xaaaaaa
  });
  
  groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 11, 11 );
  // for (var i = 0; i < groundGeometry.vertices.length; i++) {
  //   groundGeometry.vertices[i].z = (i % 256) * 0.1;
  // }
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
  // rotate the ground plane so it's horizontal
  ground.rotation.x = Math.PI * 1.5;
  ground.position.set(15, -50, 200);
  ground.castShadow = false;
  ground.receiveShadow = true;
  scene.add(ground);
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

function onResize() {
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
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
  camera.position.x += ( (mouseX * 50 )- camera.position.x ) * .05;
  makeBump(groundGeometry, new THREE.Vector3(Math.cos(time*0.02)*100, Math.sin(time*0.02)*100, 0), 100);
  // camera.position.y += ( -(mouseY * 20 - 30) - camera.position.y ) * .05;
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
