var workshop = function() {
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

    point = new THREE.PointLight(0xffffff);
    point.position.set(10, 10, 10);
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
} ();
