function SplashSoundRenderer(world) {
  this.constructor.call(this, world);
}
SplashSoundRenderer.inherits(Renderer);
SplashSoundRenderer.listensTo = ['entity:debris', 'entity:player'];

SplashSoundRenderer.prototype.createEntity = function(projectile) {
  // var vec = new THREE.Vector3();
  // vec.fromArray(projectile.get('position'));
  // charredmesh.sound.playSound("fire", vec);
};

SplashSoundRenderer.prototype.renderEntity = function(projectile) {
};

SplashSoundRenderer.prototype.removeEntity = function(projectile) {
};
