var debrisGeometry;
var objLoader2 = new THREE.OBJLoader();

objLoader2.addEventListener( 'load', function ( event ) {
  debrisGeometry = event.content;
  console.log("LOADED DEBRIS");
});
objLoader2.load("models/debris0.obj");

var DebrisRenderer = Game.Behavior.define({
  initialize: function DebrisRenderer() {
    var debrisMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0xffffff).offsetHSL(Math.random() * -0.125, (Math.random() - 0.5) * 0.125, 0),
      transparent:true,
      map: layerTextures[4]
    });

    var debrisMesh = new THREE.Mesh(debrisGeometry.children[0].geometry, debrisMaterial);
    debrisMesh.position.fromArray(this.getOption('position'));

    debrisMesh.scale.multiplyScalar(this.getOption('size'));
  
    scene.add(debrisMesh);
    this.mesh = debrisMesh;
  },

  onMessage: function(eventName, data) {
    if (eventName === 'render') {
      this.render.apply(this, data);
    }
  },

  render: function(delta) {
    this.mesh.position.fromArray(this.get('position'));
    this.mesh.rotation.fromArray(this.get('rotation'));

    var life = this.getOption('life');
    if (life < 1){
      this.mesh.material.opacity = Math.max(life, 0);
    }
  },

  destroy: function() {
    scene.remove(this.mesh);
    this.mesh = null;
  }
});
