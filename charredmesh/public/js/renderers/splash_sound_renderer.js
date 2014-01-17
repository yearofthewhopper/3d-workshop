function SplashSoundRenderer(world) {
  this.constructor.call(this, world);
}
SplashSoundRenderer.inherits(Renderer);
SplashSoundRenderer.listensTo = ['entity:splash'];

SplashSoundRenderer.prototype.createEntity = function(splash) {
  charredmesh.sound.playSound("splash", splash.getPositionVector());
};

SplashSoundRenderer.prototype.renderEntity = function(splash) {
};

SplashSoundRenderer.prototype.removeEntity = function(splash) {
};
