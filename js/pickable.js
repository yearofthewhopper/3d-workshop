var renderer, camera;
var cameraDistance;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;
var icosahedron, geometry, material;
var colors, firstColor;
var projector, raycaster;

function randomColor() {
  return new THREE.Color().setRGB(Math.random(), Math.random(), Math.random());
}

function init() {
  element = document.getElementById('workshop');
  scene = new THREE.Scene();
  ambient = new THREE.AmbientLight(0x001111);
  scene.add(ambient);

  projector = new THREE.Projector();

  point = new THREE.PointLight(0xffffff);
  point.position.set(10, 10, 10);
  scene.add(point);

  firstColor = randomColor();
  colors = [];
  for (var i = 0; i < 20; i++) {
    colors.push(new THREE.MeshLambertMaterial(
      {color: firstColor,
       shading: THREE.FlatShading}));
  }

  geometry = new THREE.IcosahedronGeometry(1, 0);
  material = new THREE.MeshFaceMaterial(colors);
  icosahedron = new THREE.Mesh(geometry, material);
  icosahedron.geometry.dynamic = true;
  for (var i = 0; i < 20; i++) {
    icosahedron.geometry.faces[i].materialIndex = i;
  }
  scene.add(icosahedron);

  time = 0;
  mouse = new THREE.Vector2(0, 0);
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  cameraDistance = 10;
  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
  camera.position.z = cameraDistance;
  camera.lookAt(scene.position);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  element.appendChild(renderer.domElement);

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
  var mouse = new THREE.Vector3(
    event.clientX / (window.innerWidth * 0.5) - 1.0, 
    -1.0 * (event.clientY / (window.innerHeight * 0.5) - 1.0), 0.0);

  raycaster = projector.pickingRay(mouse, camera);
  var intersects = raycaster.intersectObjects([icosahedron]);
  if (intersects.length > 0) {
    var materialIndex = intersects[0].face.materialIndex;
    icosahedron.material.materials[materialIndex].color = randomColor();
  }
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  time++;
  icosahedron.rotation.x += 0.01;
  camera.position.x = cameraDistance * Math.sin(time * Math.PI / 180);
  camera.position.y = cameraDistance * Math.cos(time * Math.PI / 180);
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
