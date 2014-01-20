var Explosion = Game.Object.define({
  behaviors: [
    [Vector3Copy,       { keys: ['position'] }],
    [ExplosionRenderer, { position: entity('position'), color: entity('color') }],
    [PlaySound,         { soundName: 'explosion', onEvent: 'didInitialize', position: entity('position') }],
    [AddDelta,          { varName: 'time', max: 1, eventName: 'explosionComplete' }]
  ],

  initialize: function Explosion() {
    this.set('time', 0);

    var self = this;
    this.on('explosionComplete', function() {
      self.getWorld().remove(self);
    });
  }
});
