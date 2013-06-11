var workshop = function() {
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
    cameraDistance = 80;
    camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 1000);
    camera.position.z = cameraDistance;
    camera.position.y = 80;
    camera.position.x = 80;
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Enable shadows in the renderer.
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFShadowMap;
    
    element.appendChild(renderer.domElement);

    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onResize, false);



    var groundMaterial = new THREE.MeshLambertMaterial({
      map: THREE.ImageUtils.loadTexture("img/rough-pavement.jpg")
    });
    
    var groundGeometry = new THREE.PlaneGeometry( 256, 256, 4, 4 );
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    
    // rotate the ground plane so it's horizontal
    ground.rotation.x = THREE.Math.degToRad(-90);
    ground.castShadow = false;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  // Load an OBJ file.
  function loadObj() {
    var objLoader = new THREE.OBJLoader();

    // Callback for loading of the OBJ (loading is done as an async operation)
    objLoader.addEventListener( 'load', function ( event ) {

      // event.content will be the live Mesh object representing the OBJ file.
      truckObj = event.content;
      
      scene.add(truckObj);
      
      // rotate truck a little so it's nice to look at.
      truckObj.rotation.y = THREE.Math.degToRad(45);
      applyMaterial();

      // start the animation loop, the truck is ready!
      animate();
    });

    objLoader.load( "obj/truck.obj" );
  }

  // add a material to the truck
  function applyMaterial() {

    // Create the cube environment map texture.
    var baseUrl = "img/env/swedish_castle/";
    var urls = [ baseUrl + "px.jpg", baseUrl + "nx.jpg",
                 baseUrl + "py.jpg", baseUrl + "ny.jpg",
                 baseUrl + "pz.jpg", baseUrl + "nz.jpg" ];
    var textureCube = THREE.ImageUtils.loadTextureCube( urls );

    // Create the material.
    var material = new THREE.MeshPhongMaterial( 
      { 
        map :           THREE.ImageUtils.loadTexture("img/truck/truck_color.jpg"),
        specularMap :   THREE.ImageUtils.loadTexture("img/truck/truck_refl.jpg"),
        envMap :        textureCube,
        reflectivity :  0.8,
        combine :       THREE.AddOperation,
        shininess:      500
      } );
    
    // Traverse the mesh (obj files can contain many parts, which will be children of the mesh returned from the OBJLoader)
    truckObj.traverse( function ( child ) {

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

  function onMouseDown(event) {
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    time++;
    
    // slowly rotating light to show off surface charactersitcis and shadow.
    point.position.set(Math.cos(time * 0.005) * 80, 70, Math.sin(time * 0.005) * 80);
    
    // move camera a little based on mouse position.
    camera.position.x += ( (mouseX * 50 )- camera.position.x ) * .05;
    camera.position.y += ( -(mouseY * 20 - 30) - camera.position.y ) * .05;

    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }

  window.onload = function() {
    init();
    loadObj();
  }
} ();
