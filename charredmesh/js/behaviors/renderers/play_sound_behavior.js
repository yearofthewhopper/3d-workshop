import Behavior from '../../core/behavior';

var PlaySound = Behavior.define({
  execute: function() {
    var vec = new THREE.Vector3().fromArray(this.getOption('position'));

    SoundEngine.playSound(
      this.getOption('soundName'),
      vec
    );
  },

  onMessage: function(eventName, data) {
    if (eventName === this.getOption('onEvent')) {
      this.execute.apply(this, data);
    }
  }
});

export default = PlaySound;
