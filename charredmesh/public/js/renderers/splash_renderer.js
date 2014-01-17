function SplashRenderer(world) {
  this.splashes = {};
  this.splashDirtyLookup = {};

  this.constructor.call(this, world);

  this.prepare();
}
SplashRenderer.inherits(Renderer);
SplashRenderer.listensTo = ['entity:splash'];

SplashRenderer.prototype.prepare = function() {
};

SplashRenderer.prototype.createEntity = function(splash) {
  var splashMaterial = new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture("textures/splash.png"),
    transparent: true,
    depthWrite:false
  });

  var splashMesh = new THREE.Mesh(new THREE.PlaneGeometry(5,5), splashMaterial);
  splashMesh.position.fromArray(splash.get('position'));
  splashMesh.position.y = 41;
  splashMesh.rotation = [
    -Math.PI / 2,
    0,
    Math.random() * Math.PI * 2
  ];

  scene.add(splashMesh);
  splashMesh.model = splash;

  this.splashes[splash.get('id')] = splashMesh;
};

SplashRenderer.prototype.renderEntity = function(splash, delta) {
  var id = splash.get('id');

  var dirty = false;

  if (!this.splashDirtyLookup[id]) {
    dirty = true;
  } else {
    dirty = !mori.equals(this.splashDirtyLookup[id], splash.state);
  }

  if (dirty) {
    this.splashDirtyLookup[id] = splash.state;

    var life = 2 - splash.get('time');
    var speed = splash.get('speed');
    var spin = splash.get('spin');

    this.splashes[id].scale.x += delta * speed * life;
    this.splashes[id].scale.y += delta * speed * life;
    this.splashes[id].rotation.z += spin;
    this.splashes[id].material.opacity = Math.max(0,life / 2) * ((Math.sin(life * 7) + 1) / 2 + 0.3) ;
  }
};

SplashRenderer.prototype.removeEntity = function(splash) {
  var id = splash.get('id');
  
  if (!this.splashes[id]){
    return;
  }

  scene.remove(this.splashes[id]);
  this.splashes[id].model = null;
  delete this.splashes[id];
};
