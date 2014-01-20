var Sun = Game.Object.define({
  behaviors: [
    [SunRenderer, { positionVector: ref('positionVector') }],
    [AddDelta,    { varName: 'time' }]
  ],

  initialize: function Sun() {
    this.positionVector = new THREE.Vector3();
    this.set('time', 0);

    var self = this;
    this.on('stateChange', function(info) {
      if (info.key === 'time') {
        self.positionVector.set(
          Math.cos(info.value * 0.01),
          Math.sin(info.value * 0.01),
          0
        );
      }
    });
  }
});
