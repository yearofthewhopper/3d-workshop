var container;
var camera, scene, renderer;
var uniforms, material, mesh;
var mouse;

function init() {
  container = document.getElementById('workshop');
  camera = new THREE.Camera();
  camera.position.z = 1;
  scene = new THREE.Scene();
  mouse = new THREE.Vector2(0, 0);

  uniforms = {
    time: { type: 'f', value: 1.0 },
    resolution: { type: 'v2', value: new THREE.Vector2() },
    mouse: { type: 'v2', value: new THREE.Vector2(0, 0) }
  };

  material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    vertexShader: document.getElementById('vertex-basic').textContent,
    fragmentShader: document.getElementById('fragment-shifting').textContent
  });

  mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  container.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('mousemove', onMouseMove, false);
}

function onWindowResize(event) {
  uniforms.resolution.value.x = window.innerWidth;
  uniforms.resolution.value.y = window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
  uniforms.mouse.value.x = mouse.x;
  uniforms.mouse.value.y = mouse.y;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  uniforms.time.value += 0.01;
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}







// var renderer, camera;
// var cameraDistance;
// var scene, element;
// var ambient, point;
// var aspectRatio, windowHalf;
// var mouse, time;
// var mouseX = 0;
// var mouseY = 0;
// var ground, groundGeometry, groundMaterial;
// var controls;

// function init() {
//   element = document.getElementById('workshop');
//   scene = new THREE.Scene();
//   ambient = new THREE.AmbientLight(0x001111);
//   scene.add(ambient);

//   point = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI, 1 );
//   point.position.set( -250, 250, 150 );
//   point.target.position.set( 0, 0, 0 );

//   // Set shadow parameters for the spotlight.
//   point.castShadow = true;
//   point.shadowCameraNear = 50;
//   point.shadowCameraFar = 1000;
//   point.shadowCameraFov = 50;
//   point.shadowBias = 0.0001;
//   point.shadowDarkness = 0.5;

//   // Larger shadow map size means better looking shadows but impacts performance and texture memory usage.
//   point.shadowMapWidth = 1024;
//   point.shadowMapHeight = 1024;

//   scene.add(point);

//   mouse = new THREE.Vector2(0, 0);
//   windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
//   aspectRatio = window.innerWidth / window.innerHeight;
//   cameraDistance = 400;
//   camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
//   camera.position.z = cameraDistance;
//   camera.lookAt(scene.position);

//   renderer = new THREE.WebGLRenderer();
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.shadowMapEnabled = true;
//   renderer.shadowMapType = THREE.PCFShadowMap;
//   element.appendChild(renderer.domElement);
//   // controls = new THREE.FirstPersonControls(camera, renderer.domElement);

//   document.addEventListener('keydown', onKeyDown, false);
//   document.addEventListener('keyup', onKeyUp, false);
//   document.addEventListener('mousedown', onMouseDown, false);
//   document.addEventListener('mousemove', onMouseMove, false);
//   window.addEventListener('resize', onResize, false);

//   groundMaterial = new THREE.MeshBasicMaterial({
//     map: THREE.ImageUtils.loadTexture('img/birth.jpg')
//     // color: 0xffffff
//   });
  
//   groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 4, 4 );
//   ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
//   // rotate the ground plane so it's horizontal
//   ground.rotation.x = Math.PI * 1.5;
//   ground.position.set(15, -50, 200);
//   ground.castShadow = false;
//   ground.receiveShadow = true;
//   scene.add(ground);

//   time = Date.now();
// }

// function onResize() {
//   windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
//   aspectRatio = window.innerWidth / window.innerHeight;
//   camera.aspect = aspectRatio;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }

// function onMouseMove(event) {
//   mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
//   mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
// }

// function onMouseDown(event) {

// }

// function onKeyDown(event) {

// }

// function onKeyUp(event) {

// }

// function animate() {
//   requestAnimationFrame(animate);
//   render();
// }

// function render() {
//   var past = time;
//   time = Date.now();
//   var delta = time - past;
//   // controls.update(delta);
//   camera.lookAt(scene.position);
//   renderer.render(scene, camera);
// }

// window.onload = function() {
//   init();
//   animate();
// }
