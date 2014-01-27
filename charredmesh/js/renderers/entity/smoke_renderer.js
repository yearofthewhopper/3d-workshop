import Renderer from '../../core/renderer';

export default = Renderer.define({
  initialize: function SmokeRenderer() {
    if (!SmokeRendererGlobal.particleGroup) {
      SmokeRendererGlobal.prepareGlobalParticleGroup();
    }

    var emitter = SmokeRendererGlobal.particleGroup.getFromPool();
    emitter.position.copy(this.getOption('position'));
    emitter.enable();

    this.emitter = emitter;
  },

  render: function(delta) {
    this.emitter.position.fromArray(this.getOption('position'));
  },

  destroy: function() {
    var self = this;
    window.setTimeout(function() {
      self.emitter.disable();
      SmokeRendererGlobal.particleGroup.releaseIntoPool(self.emitter);
      self.emitter = null;
    }, 250);
  }
});

var SmokeRendererGlobal = {};
SmokeRendererGlobal.prepareGlobalParticleGroup = function() {
  SmokeRendererGlobal.particleGroup = new ShaderParticleGroup({
    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
    maxAge: 3.0,
    blending: THREE.NormalBlending,
    depthTest: true
  });

  SmokeRendererGlobal.particleGroup.addPool(10, {
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
  }, false);

  scene.add(SmokeRendererGlobal.particleGroup.mesh);

  var particleClock = new THREE.Clock();
  
  function onFrame() {
    requestAnimationFrame(onFrame);
    SmokeRendererGlobal.particleGroup.tick(particleClock.getDelta());
  }

  onFrame();
};
