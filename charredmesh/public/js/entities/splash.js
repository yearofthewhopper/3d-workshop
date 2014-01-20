var Splash = Game.Object.define({
  behaviors: [
    [Vector3Copy,    { keys: ['position'] }],
    [SplashRenderer, { position: entity('position') }],
    [PlaySound,      { soundName: 'splash', onEvent: 'didInitialize', position: entity('position') }],
    [AddDelta,       { varName: 'time', max: 2, eventName: 'splashComplete' }]
  ],

  initialize: function Splash() {
    this.set('time', 0);
    this.set('spin', (Math.random() - 0.5) * 0.02);
    this.set('speed', Math.random() * 5 + 10);

    var self = this;
    this.on('splashComplete', function() {
      self.getWorld().remove(self);
    });
  }
});
