import Behavior from '../../core/behavior';

var DustRenderer = Behavior.define({
  initialize: function DustRenderer() {
    if (!DustRendererGlobal.particleGroup) {
      DustRendererGlobal.prepareGlobalParticleGroup();
    }

    if (this.emitter) {
      this.emitter.enable();
    } else {
      var emitter = DustRendererGlobal.particleGroup.getFromPool();
      emitter.position.copy(this.getOption('position'));

      this.emitter = emitter;
    }
  },

  onMessage: function(eventName, data) {
    if (eventName === 'render') {
      this.render.apply(this, data);
    }
  },

  render: function(delta) {
    this.emitter.position.fromArray(this.getOption('position'));
  },

  destroy: function() {
    this.emitter && this.emitter.disable();
  }
});

DustRendererGlobal = {};
DustRendererGlobal.prepareGlobalParticleGroup = function() {
  DustRendererGlobal.particleGroup = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 1.0,
    blending: THREE.NormalBlending,
    depthTest:true
  });

  DustRendererGlobal.particleGroup.addPool(20, {
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
  }, false);

  scene.add(DustRendererGlobal.particleGroup.mesh);

  var particleClock = new THREE.Clock();

  function onFrame() {
    requestAnimationFrame(onFrame);
    DustRendererGlobal.particleGroup.tick(particleClock.getDelta());
  }

  onFrame();
};

export default = DustRenderer;
