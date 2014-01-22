var aspectRatio, windowHalf;

function ThreeJSCoreRenderer() {
  this.prepare();
  this.render = function() {
    renderer.clear();
    renderer.render(scene, camera);
  }
}

ThreeJSCoreRenderer.prototype.prepare = function() {
  initScene();
  scene.add(point);
  initGeometry();
};

ThreeJSCoreRenderer.prototype.resize = function() {
  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

function initScene() {
  clock = new THREE.Clock();
  mouse = new THREE.Vector2(0, 0);

  windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
  aspectRatio = window.innerWidth / window.innerHeight;
  
  window.scene = new THREE.Scene();  

  camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 30000);
  camera.position.z = 8192;
  camera.position.x = 8192;
  camera.position.y = 400;


  gunCamera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 30000);
  gunCameraRenderTarget = new THREE.WebGLRenderTarget( 100, 100, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat } );

  //camera.lookAt(new THREE.Vector3(2048,0,2048));
  //camera.target = new THREE.Vector3(2048,0,2048);

  // Initialize the renderer
  renderer = new THREE.WebGLRenderer( {
    clearColor: 0x000000, 
    antialias:true
    //precision:'highp',
    //antialias: true,
    //stencil: false,
    //premultipliedAlpha: true 
  });
  renderer.autoClear = false;
  
  renderer.sortObjects = false;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;

  element = document.getElementById('viewport');
  element.appendChild(renderer.domElement);

  time = Date.now();
}

var loadShaderSource = window.loadShaderSource = function loadShaderSource(scriptId){
  var source = document.getElementById(scriptId).textContent;

  for(var itm in THREE.ShaderChunk) {
    if(source.indexOf("//INCLUDE_CHUNK:" + itm) != -1) {
      console.log("INCUDING CHUNK: " + itm);
      source = source.replace("//INCLUDE_CHUNK:" + itm, THREE.ShaderChunk[itm]);
    }
  }

  return source;
}

function initGeometry(){
  // Player model

  var objLoader = new THREE.OBJLoader();

  objLoader.addEventListener( 'load', function ( event ) {
    tankModel = event.content;
    tankModel.scale.set(1.1, 1.1, 1.1);
    tankModel.position.set(0, 0, 0);

    tankModel.traverse(function(obj){
      switch(obj.name){
        case "turret barrel_mount":
          obj.geometry.applyMatrix(new THREE.Matrix4().makeTranslation( 0, -18, -6 ));    
          obj.position.y += 18;
          obj.position.z += 6;
          break;
        case "turret barrel_mount barrel":
          obj.geometry.applyMatrix(new THREE.Matrix4().makeTranslation( 0, -18, -6 ));    
          break;
      }
    });
    
    readyFlags.geometry = true;
    checkReadyState();
  });

  objLoader.load( "models/tank_parts.obj" ); 
}

export default = ThreeJSCoreRenderer;
