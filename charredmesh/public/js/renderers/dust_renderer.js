function DustRenderer(world) {
  this.playersAreDriving = {};
  this.playerEmitters = {};

  this.constructor.call(this, world);

  this.prepare();
}
DustRenderer.inherits(Renderer);
DustRenderer.listensTo = ['entity:player', 'before:render'];

DustRenderer.prototype.prepare = function() {
  var trackDustEmitterSettings = {
    type: 'cube',
    positionSpread: new THREE.Vector3(20, 1, 20),
    radius: 3,
    speed: 1,
    size: 40,
    sizeSpread: 15,
    sizeEnd: 200,
    opacityStart: 0.45,
    opacityEnd: 0,
    acceleration:new THREE.Vector3(0, 1, 0),
    accelerationSpread:new THREE.Vector3(1, 0, 1),
    colorStart: new THREE.Color(0xebdcb6),
    colorEnd: new THREE.Color(0xebe7dc),
    particlesPerSecond: 20,
    alive: 0
  };

  this.emitter = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 1.0,
    blending: THREE.NormalBlending,
    depthTest:true
    //depthWrite:true
  });

  this.emitter.addPool( 20, trackDustEmitterSettings, false );
  
  // Add particle group to scene.
  scene.add( this.emitter.mesh );
};

DustRenderer.prototype.createEntity = function(player) {
  this.playersAreDriving[player.get('id')] = player.get('isDriving');

  var emitter = this.emitter.getFromPool();
  emitter.position.copy(player.getPositionVector());

  this.playerEmitters[player.get('id')] = emitter;
};

DustRenderer.prototype.renderEntity = function(player) {
  var nowDriving = player.get('isDriving');

  if (nowDriving !== this.playersAreDriving[player.get('id')]){
    if (nowDriving) {
      this.playerEmitters[player.get('id')].enable();
    } else {
      this.playerEmitters[player.get('id')].disable();
    }

    this.playersAreDriving[player.get('id')] = nowDriving;
  }

  this.playerEmitters[player.get('id')].position.copy(player.getPositionVector());
};

DustRenderer.prototype.removeEntity = function(player) {
  delete this.playersAreDriving[player.get('id')];

  this.emitter.releaseIntoPool(this.playerEmitters[player.get('id')]);
  delete this.playerEmitters[player.get('id')];
};

DustRenderer.prototype.beforeRender = function(delta, renderer) {
  this.emitter.tick(delta);
};
