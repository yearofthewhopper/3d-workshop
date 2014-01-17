var debrisGeometry;

function DebrisRenderer(world) {
  this.debris = {};
  this.debrisDirtyLookup = {};

  this.constructor.call(this, world);

  this.prepare();
}
DebrisRenderer.inherits(Renderer);
DebrisRenderer.listensTo = ['entity:debris'];

DebrisRenderer.prototype.prepare = function() {
  var objLoader2 = new THREE.OBJLoader();
  
  objLoader2.addEventListener( 'load', function ( event ) {
    debrisGeometry = event.content;
    console.log("LOADED DEBRIS");
  });
  objLoader2.load("models/debris0.obj");
};

DebrisRenderer.prototype.createEntity = function(debris) {
  var debrisMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color(0xffffff).offsetHSL(Math.random() * -0.125, (Math.random() - 0.5) * 0.125, 0),
    transparent:true,
    map: layerTextures[4]
  });

  var debrisMesh = new THREE.Mesh(debrisGeometry.children[0].geometry, debrisMaterial);
  debrisMesh.position.fromArray(debris.get('position'));

  var size = debris.get('size');
  debrisMesh.scale.multiplyScalar(debris.get('randomSize') * (size[0] + size[1]));

  scene.add(debrisMesh);
  debrisMesh.model = debris;

  this.debris[debris.get('id')] = debrisMesh;
};

DebrisRenderer.prototype.renderEntity = function(debris) {
  var id = debris.get('id');

  var dirty = false;

  if (!this.debrisDirtyLookup[id]) {
    dirty = true;
  } else {
    dirty = !mori.equals(this.debrisDirtyLookup[id], debris.state);
  }

  if (dirty) {
    this.debrisDirtyLookup[id] = debris.state;

    this.debris[id].position.fromArray(debris.get('position'));
    this.debris[id].rotation.fromArray(debris.get('rotation'));

    var lifeSpan = debris.get('lifeSpan');
    var time = debris.get('time');
    
    if (lifeSpan - time < 1){
      this.debris[id].material.opacity = lifeSpan - time;
    }
  }
};

DebrisRenderer.prototype.removeEntity = function(debris) {
  var id = debris.get('id');
  
  if (!this.debris[id]){
    return;
  }

  scene.remove(this.debris[id]);
  this.debris[id].model = null;
  delete this.debris[id];
};
