var PlaySound = Game.Behavior.define({
  execute: function() {
    var vec = new THREE.Vector3().fromArray(this.getOption('position'));

    charredmesh.sound.playSound(
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
