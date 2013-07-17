var renderer, camera;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

var controls;
var clock;

var ground, groundGeometry, groundMaterial;
var particles, particleSystem, particleGeometry, particlePositions, particleColors;
var particleMax, particleDistances, particleCenter, idealColor;

function initScene() {
  clock = new THREE.Clock();
  mouse = new THREE.Vector2(0, 0);
  // idealColor = [1.0, 1.0, 0.3];
  idealColor = [0.3, 1.0, 1.0];
  inverseColor = [0.4, 0.0, 0.0];

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
    map: THREE.ImageUtils.loadTexture("img/birth.jpg")
  });
  
  groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 4, 4 );
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
  // rotate the ground plane so it's horizontal
  ground.rotation.x = Math.PI * 1.5;
  ground.position.set(15, -50, 200);
  ground.castShadow = false;
  ground.receiveShadow = true;

  scene.add(ground);
}

function initParticles() {
  // add particles
  particles = 500000;
	particleGeometry = new THREE.BufferGeometry();
  particleGeometry.dynamic = true;
	particleGeometry.attributes = {
		position: {
			itemSize: 3,
			array: new Float32Array( particles * 3 ),
			numItems: particles * 3
		},
		color: {
			itemSize: 3,
			array: new Float32Array( particles * 3 ),
			numItems: particles * 3
		}
	}

	particlePositions = particleGeometry.attributes.position.array;
	particleColors = particleGeometry.attributes.color.array;

	var n = 1000, n2 = n / 2; // particles spread in the cube

	for ( var i = 0; i < particlePositions.length; i += 3 ) {
		// positions
		var x = Math.random() * n - n2;
		var y = Math.random() * n - n2;
		var z = Math.random() * n - n2;

		particlePositions[i]   = x;
		particlePositions[i+1] = y;
		particlePositions[i+2] = z;

    //colors
		var vx = ( x / n ) + 0.5;
		var vy = ( y / n ) + 0.5;
		var vz = ( z / n ) + 0.5;

		particleColors[ i ]     = vx;
		particleColors[ i + 1 ] = vy;
		particleColors[ i + 2 ] = vz;
	}

	particleGeometry.computeBoundingSphere();

	var material = new THREE.ParticleBasicMaterial({size: 15, vertexColors: true});
	particleSystem = new THREE.ParticleSystem(particleGeometry, material);

	scene.add(particleSystem);
}

function init(){
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);

  window.addEventListener('resize', onResize, false);

  initScene();
  initLights();
  // initGeometry();
  initParticles();
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

	particleGeometry.attributes.position.needsUpdate = true;
	particleGeometry.attributes.color.needsUpdate = true;
  particleGeometry.computeBoundingSphere();

  controls.update();
  renderer.render(scene, camera);
}


window.onload = function() {
  init();
  animate();
}
