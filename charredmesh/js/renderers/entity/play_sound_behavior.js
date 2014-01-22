import Renderer from '../../core/renderer';

var PlaySound = Renderer.define({
  execute: function() {
    var vec = new THREE.Vector3().fromArray(this.getOption('position'));

    SoundEngine.playSound(
      this.getOption('soundName'),
      vec
    );
  }
});

export default = PlaySound;
