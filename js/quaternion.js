var renderer, camera;
var cameraDistance;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;

var mouseX = 0;
var mouseY = 0;

var skyLight;
var groundPlane;
var obj;

var objRotation, objQuaternion, rotationDelta = 0.03;
var path, interpolation;

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
  
  skyLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.2 );
  skyLight.color.setHSL( 0.6, 0.75, 1 );
  skyLight.groundColor.setHSL( 0.095, 0.5, 1 );
  skyLight.position.set( 0, 500, 0 );
  scene.add( skyLight );

  time = 0;

  mouse = new THREE.Vector2(0, 0);
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  cameraDistance = -120;
  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
  camera.position.z = cameraDistance;
  camera.lookAt(scene.position);

  objRotation = new THREE.Vector3(0, 0, 0);
  objQuaternion = new THREE.Quaternion();
  interpolation = {
    progress: -1, 
    steps: 100, 
    step: 0,
    state: "none", // quaternion or rotation
    quaternion: new THREE.Quaternion(),
    rotation: new THREE.Vector3(0, 0, 0)
  };
  clearPath();

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Enable shadows in the renderer.
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;
  
  element.appendChild(renderer.domElement);

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('resize', onResize, false);

  var groundMaterial = new THREE.MeshPhongMaterial({
    map: THREE.ImageUtils.loadTexture("img/birth.jpg")
    // color: 0xffffff
  });
  
  var groundGeometry = new THREE.PlaneGeometry( 1028, 1028, 4, 4 );
  var ground = new THREE.Mesh(groundGeometry, groundMaterial);
  
  // rotate the ground plane so it's horizontal
  ground.rotation.x = THREE.Math.degToRad(-90);
  ground.position.set(15, -50, 200);
  ground.castShadow = false;
  ground.receiveShadow = true;
  scene.add(ground);
}

// Load an OBJ file.
function loadObj(objFile) {
  var objLoader = new THREE.OBJLoader();

  // Callback for loading of the OBJ (loading is done as an async operation)
  objLoader.addEventListener( 'load', function ( event ) {

    // event.content will be the live Mesh object representing the OBJ file.
    obj = event.content;
    
    scene.add(obj);
    
    obj.scale.set(0.1, 0.1, 0.1);
    obj.rotation.copy(objRotation);
    obj.quaternion.copy(objQuaternion);
    applyMaterial(obj);

    animate();
  });

  objLoader.load(objFile);
}

function applyMaterial(obj) {
  var material = new THREE.MeshPhongMaterial( 
    { map :           THREE.ImageUtils.loadTexture("img/reef2.jpg"),
      reflectivity :  0.8,
      combine :       THREE.AddOperation,
      shininess:      50
    } );
  
  // Traverse the mesh (obj files can contain many parts, which will be children of the mesh returned from the OBJLoader)
  obj.traverse( function ( child ) {

    // Set material and shadow parameters for all child Mesh instances.
    if ( child instanceof THREE.Mesh ) {
      child.geometry.computeVertexNormals();
      child.material = material;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  } );
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

function quaternionObj(obj, axis, shift) {
  if (!obj.useQuaternion) {
    obj.useQuaternion = true;
    objQuaternion.setFromEuler(objRotation);
  }
  objQuaternion[axis] += rotationDelta * shift;
  objQuaternion.normalize();
  obj.quaternion.copy(objQuaternion);
  objRotation.setEulerFromQuaternion(objQuaternion);
  return obj;
}

function rotateObj(obj, axis, shift) {
  if (obj.useQuaternion) {
    obj.useQuaternion = false;
    objRotation.setEulerFromQuaternion(objQuaternion);
  }
  objRotation[axis] += rotationDelta * shift;
  obj.rotation.copy(objRotation);
  objQuaternion.setFromEuler(objRotation);
  return obj;
}

function plantWaypost() {
  var quaternion = new THREE.Quaternion().copy(objQuaternion);
  var rotation = new THREE.Vector3().copy(objRotation);
  path.push({quaternion: quaternion, rotation: rotation});
  console.log(path);
}

function clearPath() {
  path = [{quaternion: new THREE.Quaternion(), rotation: new THREE.Vector3()}];
}

function interpolate(path, state) {
  // we can't interpolate if we don't have at least two points!
  if (path.length < 2) {return};
  var place, target;

  function placeTarget() {
    place = path[state.progress];
    target = path[state.progress - 1];
  }

  function resetState() {
    state.progress = path.length - 1;
    state.step = 0;
    placeTarget();
  }

  // find the current step of the path we are interpolating
  state.step += 1;
  if (state.step >= state.steps) {
    state.progress -= 1;
    state.step = 0;
  }
  placeTarget();
  if (!place || !target) {
    resetState();
  }

  var angle = state.step * (1.0 / state.steps);
  switch(state.state) {
    case "quaternion": 

    THREE.Quaternion.slerp(place.quaternion, target.quaternion, state.quaternion, angle);
    objQuaternion.copy(state.quaternion);
    objRotation.setEulerFromQuaternion(objQuaternion);
    obj.useQuaternion = true;
    obj.quaternion.copy(objQuaternion);
    break;

    case "rotation": 

    var placeCopy = new THREE.Vector3().copy(place.rotation);
    var targetCopy = new THREE.Vector3().copy(target.rotation);
    state.rotation = placeCopy.multiplyScalar(1 - angle).add(targetCopy.multiplyScalar(angle))
    objRotation.copy(state.rotation);
    objQuaternion.setFromEuler(objRotation);
    obj.useQuaternion = false;
    obj.rotation.copy(objRotation);
    break;
  }
}

function onKeyDown(event) {
  console.log("KEY DOWN");
  console.log(event);

  var shift = event.shiftKey ? -1 : 1;

  switch(event.keyCode) {

    // euler rotations
    case 88: rotateObj(obj, "x", shift); break;
    case 89: rotateObj(obj, "y", shift); break;
    case 90: rotateObj(obj, "z", shift); break;

    // quaternion rotations
    case 73: quaternionObj(obj, "x", shift); break;
    case 74: quaternionObj(obj, "y", shift); break;
    case 75: quaternionObj(obj, "z", shift); break;
    case 87: quaternionObj(obj, "w", shift); break;

    // path creation
    case 32: event.shiftKey ? clearPath() : plantWaypost(); break;
    case 81: interpolation.state = "quaternion"; break;
    case 82: interpolation.state = "rotation"; break;
    case 83: interpolation.state = "none"; break;
  }
}

function onKeyUp(event) {

}

function onMouseDown(event) {

}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  time++;
  
  // slowly rotating light to show off surface characteristics and shadow.
  point.position.set(Math.cos(time * -0.005) * 80, 70, Math.sin(time * -0.005) * 80);
  
  // move camera a little based on mouse position.
  camera.position.x += ( (mouseX * 50 )- camera.position.x ) * .05;
  camera.position.y += ( -(mouseY * 20 - 30) - camera.position.y ) * .05;

  interpolate(path, interpolation);

  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  loadObj( "obj/ladybird.obj" );
}
