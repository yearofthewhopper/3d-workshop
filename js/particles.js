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
var cameraDistance;

function initScene() {
  clock = new THREE.Clock();
  mouse = new THREE.Vector2(0, 0);
  outerColor = [0.3, 1.0, 1.0];
  middleColor = [1.0, 1.0, 0.0];
  middleColor = [0.4, 0.0, 0.0];
  innerColor = [0.4, 0.0, 0.0];
  cameraDistance = 600;

  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  
  scene = new THREE.Scene();  

  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 10000);
  camera.position.z = cameraDistance;
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

function updateParticleColors() {
  for (var p = 0; p < particles * 4; p+=4) {
    var distance = particleDistances[p/4] / particleMax;
    if (distance > 1 || distance < 0 || isNaN(distance)) console.log(distance);
    inverse = 1 - distance;

    inner = inverse * inverse;
    middle = 2 * distance * inverse;
    outer = distance * distance

	  particleColors[p]   = outerColor[0] * outer + middleColor[0] * middle + innerColor[0] * inner;
	  particleColors[p+1] = outerColor[1] * outer + middleColor[1] * middle + innerColor[1] * inner;
	  particleColors[p+2] = outerColor[2] * outer + middleColor[2] * middle + innerColor[2] * inner;

	  // particleColors[p]   = idealColor[0] * distance + inverseColor[0] * inverse;
	  // particleColors[p+1] = idealColor[1] * distance + inverseColor[1] * inverse;
	  // particleColors[p+2] = idealColor[2] * distance + inverseColor[2] * inverse;

    particleColors[p+3] = 0.1;
  }
}

function initParticles() {
  // add particles
  particles = 500000;
  particleCenter = [0, 0, 0];

	particleGeometry = new THREE.BufferGeometry();
  particleGeometry.dynamic = true;
	particleGeometry.attributes = {
		position: {
			itemSize: 3,
			array: new Float32Array( particles * 3 ),
			numItems: particles * 3
		},
		color: {
			itemSize: 4,
			array: new Float32Array( particles * 4 ),
			numItems: particles * 4
		}
	}

	particlePositions = particleGeometry.attributes.position.array;
	particleColors = particleGeometry.attributes.color.array;
  particleDistances = new Float32Array(particles);
  particleMax = 0;
  var currentCenter = [0, 0, 0];
	// var color = new THREE.Color();

	var n = 1000, n2 = n / 2; // particles spread in the cube

	for ( var i = 0; i < particlePositions.length; i += 3 ) {
		// positions
		var x = Math.random() * n - n2;
		var y = Math.random() * n - n2;
		var z = Math.random() * n - n2;
    var distance = Math.sqrt(x*x+y*y+z*z);

		particlePositions[i]   = x;
		particlePositions[i+1] = y;
		particlePositions[i+2] = z;
    particleDistances[i/3] = distance;

    particleMax = Math.max(particleMax, distance);
    currentCenter[0] += particlePositions[i];
    currentCenter[1] += particlePositions[i+1];
    currentCenter[2] += particlePositions[i+2];

		// colors
		// var vx = ( x / n ) + 0.5;
		// var vy = ( y / n ) + 0.5;
		// var vz = ( z / n ) + 0.5;

		// color.setRGB( vx, vy, vz );

		// particleColors[ i ]     = color.r;
		// particleColors[ i + 1 ] = color.g;
		// particleColors[ i + 2 ] = color.b;

		// particleColors[ i ]     = 0.7;
		// particleColors[ i + 1 ] = 0.7;
		// particleColors[ i + 2 ] = 0;
	}
  particleCenter[0] = currentCenter[0] / particles;
  particleCenter[1] = currentCenter[1] / particles;
  particleCenter[2] = currentCenter[2] / particles;

  updateParticleColors();
  // originalPositions = new Float32Array(particles*3);
  // for (var p = 0; p < particlePositions.length; p++) {
  //   originalPositions[p] = particlePositions[p];
  // }
  // particleRates = new Float32Array(particles*3);
  // for (var p = 0; p < particlePositions.length; p++) {
  //   particleRates[p] = 500 / particlePositions[p];
  // }
	particleGeometry.computeBoundingSphere();

	var material = new THREE.ParticleBasicMaterial({size: 5, vertexColors: true, transparent: true});
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

function mod(n, d) {
  while (n < 0) n += d;
  while (n >= d) n -= d;
  return n;
}

function updateParticlePositions() {
  particleMax = 0;
  var currentCenter = [0, 0, 0];

  for (var p = 0; p < particlePositions.length; p += 3) {
    var a = particlePositions[p];
    var b = particlePositions[p+1];
    var c = particlePositions[p+2];

    a += (particlePositions[mod(p + 3, particles)] - a) * 0.2;
    b += (particlePositions[mod(p + 4, particles)] - b) * 0.2;
    c += (particlePositions[mod(p + 5, particles)] - c) * 0.2;

    var aa = a - particleCenter[0];
    var bb = b - particleCenter[1];
    var cc = c - particleCenter[2];
    var distance = Math.sqrt((aa*aa)+(bb*bb)+(cc*cc));
    particleDistances[p/3] = distance * 0.99;
    particleMax = Math.max(particleMax, distance);

    particlePositions[p] = a;
    particlePositions[p+1] = b;
    particlePositions[p+2] = c;

    currentCenter[0] += particlePositions[p];
    currentCenter[1] += particlePositions[p+1];
    currentCenter[2] += particlePositions[p+2];
  }
  particleCenter[0] = currentCenter[0] / particles;
  particleCenter[1] = currentCenter[1] / particles;
  particleCenter[2] = currentCenter[2] / particles;
}

function render() {
  var delta = clock.getDelta();
  time += delta;

  updateParticlePositions();
  updateParticleColors();

	particleGeometry.attributes.position.needsUpdate = true;
	particleGeometry.attributes.color.needsUpdate = true;
  particleGeometry.computeBoundingSphere();

  // camera.position.set(Math.sin(time * 0.5) * cameraDistance, 0, Math.cos(time * 0.5) * cameraDistance);
  // camera.lookAt(scene);

  controls.update();
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
}
