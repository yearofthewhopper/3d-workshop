var renderer, camera;
var cameraDistance;
var scene, element;
var ambient, point;
var aspectRatio, windowHalf;
var mouse, time;
var controls;

var groundMaterial;

var context2d;
var sourceImage;

var layerTextures = [];
var firstDraw = true;
var chumbo = 0;
var uniforms;
var animateLight = false;


function init() {

  layerTextures.push( THREE.ImageUtils.loadTexture("img/terrain/tile_grass.png") );
  layerTextures.push( THREE.ImageUtils.loadTexture("img/terrain/tile_dirt.png") );
  layerTextures.push( THREE.ImageUtils.loadTexture("img/terrain/tile_rock.png") );

  // set layer textures so they wrap in both dimensions since they'll be repeating.
  for(var i = 0; i < layerTextures.length; i++){
    layerTextures[i].wrapS = layerTextures[i].wrapT = THREE.RepeatWrapping;
  }

  element = document.getElementById('workshop');
  scene = new THREE.Scene();
 
  // Terrain lighting is handled in the fragment shader, no lights are needed in the scene.

 /* ambient = new THREE.AmbientLight(0x001111);
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

  scene.add(point); */

  time = 0;
  mouse = new THREE.Vector2(0, 0);
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  cameraDistance = 300;
  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 100000);
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

  controls = new THREE.OrbitControls( camera );

  uniforms = { 
    height: {type:"f", value:75.0},
    repeat: {type:"f", value:8.0},
    light: {type:"i", value:1},
    light_pos: {type: "v3", value: new THREE.Vector3(0.1,0.2,0.5) },
    normalmap: { type: "t", value: THREE.ImageUtils.loadTexture("img/terrain/terrain_height_map_normals.png") },
    heightmap: { type: "t", value: THREE.ImageUtils.loadTexture("img/terrain/terrain_height_map.jpg") },
    tex0: { type: "t", value: layerTextures[0] } ,
    tex1: { type: "t", value: layerTextures[1] } ,
    tex2: { type: "t", value: layerTextures[2] } 
  };
 
  var vertex_shader=[
    "uniform sampler2D heightmap;",
    "uniform float height;",
    "varying vec2 vUv;",
    "void main() {",
        "vec4 color = texture2D( heightmap, uv );",
        "vUv = uv;",
        "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
        "worldPosition.z = color.r * 100.0;",
        "vec3 pos = position;",
        "pos.z += color.r * height;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );",
      "}"
  ].join("\n");

  var fragment_shader = [
    "varying vec2 vUv;",
    "uniform float repeat;",
    "uniform int light;",
    
    "uniform sampler2D heightmap;",
    "uniform sampler2D normalmap;",
    
    "uniform sampler2D tex0;",
    "uniform sampler2D tex1;",
    "uniform sampler2D tex2;",

    "uniform vec3 light_pos;",
    
    "void main() {",
    "  float height = texture2D( heightmap, vUv ).r;",
    "  vec2 texPos = vUv * repeat;",
    "  vec3 norm = (texture2D(normalmap, vUv).rgb - vec3(0.5,0.5,0.5)) * 2.0;",
    "  float angle = dot(norm, normalize(light_pos));",
    
    "  if(light == 0){ angle = 1.0; }",

    "  if(height < 0.5) {",
    "    gl_FragColor = mix( texture2D( tex0, texPos ), texture2D( tex1, texPos), pow((height * 2.0), 8.0) ) * angle;",
    "  } else {",
    "    gl_FragColor = mix( texture2D( tex1, texPos ), texture2D( tex2, texPos), (height - 0.5) * 2.0 ) * angle;",
    "  }",
    "}"
  ].join("\n");

  var groundGeometry = new THREE.PlaneGeometry(1024, 1024, 256, 256);
  groundMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertex_shader,
    fragmentShader: fragment_shader}
  );

  var ground = new THREE.Mesh(groundGeometry, groundMaterial);

  ground.rotation.x = THREE.Math.degToRad(-90);
  ground.position.set(0, 0, 0);
  scene.add(ground);

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
  controls.update();
}

function render() {
  time++;

  if(animateLight){
    uniforms.light_pos.value.x = Math.cos(time / 100);
    uniforms.light_pos.value.y = Math.sin(time / 200);
    uniforms.light_pos.value.z = Math.abs(Math.sin(time / 100));
  }

  renderer.render(scene, camera);
}

window.onload = function() {
  init();
  animate();
  
  wireControl("height", {min : 0, max : 200});
  wireControl("repeat", {min : 0, max : 20});
  wireControl("light",  {min : 0, max : 1});

  var viewport = document.getElementById("workshop");
  viewport.addEventListener("mouseover", function() {
    controls.enabled = true;
  });
  viewport.addEventListener("mouseout", function() {
    controls.enabled = false;
  });
}


function wireControl(param, options){
  var container = document.createElement("div");

  var label = document.createElement("label");
  label.innerHTML = param;

  container.appendChild(label);

  switch(uniforms[param].type){
    case "f":
      var ctrl = document.createElement("input");
      ctrl.type = "range";
      ctrl.min = options.min ? options.min : 0;
      ctrl.max = options.max ? options.max : 1;
      ctrl.value = uniforms[param].value;
      ctrl.name = param;
      ctrl.addEventListener("change", function(event){
        uniforms[param].value = ctrl.value;
      })
      container.appendChild(ctrl);
    break;

    case "i":
      var ctrl = document.createElement("input");
      ctrl.type = "number";
      ctrl.min = options.min ? options.min : 0;
      ctrl.max = options.max ? options.max : 1;
      ctrl.value = uniforms[param].value;
      ctrl.name = param;
      ctrl.addEventListener("change", function(event){
        uniforms[param].value = ctrl.value;
      })
      container.appendChild(ctrl);
    break;
  }

  document.getElementById("controls").appendChild(container);
}