import Renderer from '../../core/renderer';

export default = Renderer.define({
  initialize: function SplashRenderer() {
    var splashMaterial = new THREE.MeshLambertMaterial({
      map: THREE.ImageUtils.loadTexture("textures/splash.png"),
      transparent: true,
      depthWrite:false
    });

    var splashMesh = new THREE.Mesh(new THREE.PlaneGeometry(5,5), splashMaterial);
    splashMesh.position.fromArray(this.getOption('position'));
    splashMesh.position.y = 41;
    splashMesh.rotation = [
      -Math.PI / 2,
      0,
      Math.random() * Math.PI * 2
    ];

    scene.add(splashMesh);
    this.mesh = splashMesh;
  },

  render: function(delta) {
    var life = 2 - this.get('time');
    var speed = this.get('speed');
    var spin = this.get('spin');

    this.mesh.scale.x += delta * speed * life;
    this.mesh.scale.y += delta * speed * life;
    this.mesh.rotation.z += spin;
    this.mesh.material.opacity = Math.max(0,life / 2) * ((Math.sin(life * 7) + 1) / 2 + 0.3);
  },

  destroy: function() {
    scene.remove(this.mesh);
    this.mesh = null;
  }
});
