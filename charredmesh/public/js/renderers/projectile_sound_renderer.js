function ProjectileSoundRenderer(world) {
  this.constructor.call(this, world);
}
ProjectileSoundRenderer.inherits(Renderer);
ProjectileSoundRenderer.listensTo = ['entity:projectile'];

ProjectileSoundRenderer.prototype.createEntity = function(projectile) {
  var vec = new THREE.Vector3();
  vec.fromArray(projectile.get('position'));
  charredmesh.sound.playSound("fire", vec);
};

ProjectileSoundRenderer.prototype.renderEntity = function(projectile) {
};

ProjectileSoundRenderer.prototype.removeEntity = function(projectile) {
};
