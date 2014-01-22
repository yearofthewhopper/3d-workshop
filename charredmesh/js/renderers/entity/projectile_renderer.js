import Renderer from '../../core/renderer';

var ProjectileRenderer = Renderer.define({
  initialize: function ProjectileRenderer() {
    var projectilematerial = new THREE.MeshLambertMaterial({
      color: this.getOption('color'),
      emissive: 0x222222
    });
    var caliber = 1.5;
    var projectilegeom = new THREE.CylinderGeometry(0, caliber, 20, 16);
    var projectilemesh = new THREE.Mesh(projectilegeom, projectilematerial);
    var projectileobj = new THREE.Object3D();
    projectilemesh.rotation.x = Math.PI / 2;
    projectileobj.add(projectilemesh);
    projectileobj.position.fromArray(this.getOption('position'));

    projectileobj.lookAt(
      projectileobj.position.clone().add(
        new THREE.Vector3().fromArray(this.entity.get('velocity'))));

    scene.add(projectileobj);
    this.mesh = projectileobj;
  },

  render: function(delta) {
    this.mesh.position.fromArray(this.getOption('position'));
    this.mesh.lookAt(
      this.mesh.position.clone().add(
        new THREE.Vector3().fromArray(this.entity.get('velocity')))); 
  },

  destroy: function() {
    scene.remove(this.mesh);
    this.mesh = null;
  }
});

export default = ProjectileRenderer;
