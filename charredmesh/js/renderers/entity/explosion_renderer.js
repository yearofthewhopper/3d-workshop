import Renderer from '../../core/renderer';

export default = Renderer.define({
  initialize: function ExplosionRenderer() {
    var explosionmaterial = new THREE.MeshBasicMaterial({
      color: this.getOption('color'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest:true,
      depthWrite:false
    });

    var explosiongeom = new THREE.SphereGeometry(1, 16, 16);
    var explosionmesh = new THREE.Mesh(explosiongeom, explosionmaterial);

    explosionmesh.position.fromArray(this.getOption('position'));

    scene.add(explosionmesh);
    this.mesh = explosionmesh;
  },

  render: function(delta) {
    var time = this.entity.get('time');

    if (time <= 0) { return; }

    var radius = Math.log(time * 1000) * 40;

    if (time > 0.5) {
      this.mesh.material.opacity -= delta * 2;
    }
    this.mesh.scale.set(radius, radius, radius);
  },

  destroy: function() {
    scene.remove(this.mesh);
    this.mesh = null;
  }
});
