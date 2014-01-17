function BulletTrailRenderer(world) {
  this.projectileEmitters = {};

  this.constructor.call(this, world);

  this.prepare();
}
BulletTrailRenderer.inherits(Renderer);
BulletTrailRenderer.listensTo = ['entity:projectile', 'before:render'];

BulletTrailRenderer.prototype.prepare = function() {
  var bulletTrailEmitterSettings = {
    type: 'sphere',
    positionSpread: new THREE.Vector3(1, 1, 1),
    radius: 3,
    speed: 1,
    size: 10,
    sizeSpread: 10,
    sizeEnd: 300,
    opacityStart: 0.5,
    opacityEnd: 0,
    acceleration:new THREE.Vector3(0, 8, 0),
    accelerationSpread:new THREE.Vector3(3, 5, 3),
    colorStart: new THREE.Color('gray'),
    colorEnd: new THREE.Color('white'),
    particlesPerSecond: 50,
    alive: 0
  };

  this.emitter = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 3.0,
    blending: THREE.NormalBlending,
    depthTest:true
    //depthWrite:true
  });

  this.emitter.addPool( 10, bulletTrailEmitterSettings, false );
  
  // Add particle group to scene.
  scene.add( this.emitter.mesh );
};

BulletTrailRenderer.prototype.createEntity = function(projectile) {
  var emitter = this.emitter.getFromPool();
  emitter.position.fromArray(projectile.get('position'));
  emitter.enable();

  this.projectileEmitters[projectile.get('id')] = emitter;
};

BulletTrailRenderer.prototype.renderEntity = function(projectile) {
  this.projectileEmitters[projectile.get('id')].position.fromArray(projectile.get('position'));
};

BulletTrailRenderer.prototype.removeEntity = function(projectile) {
  var emitterRef = this.projectileEmitters[projectile.get('id')];
  delete this.projectileEmitters[projectile.get('id')];
  
  var self = this;
  window.setTimeout(function() {
    emitterRef.disable();
    self.emitter.releaseIntoPool(emitterRef);  
  }, 250);
};

BulletTrailRenderer.prototype.beforeRender = function(delta, renderer) {
  this.emitter.tick(delta);
};
