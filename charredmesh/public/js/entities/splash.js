var Splash = (function() {
  return GameObject.define(
    Splash,
    withVector('position'),
    withComponents(
      IncrementDeltaBehavior({ varName: 'time', max: 2, eventName: 'splashComplete' })));


  function Splash() {
    this.on('before:initialize', function() {
      this.params.time = 0;
      this.params.spin = (Math.random() - 0.5) * 0.02;
      this.params.speed = Math.random() * 5 + 10;
    });

    this.on('splashComplete', function() {
      this.world.remove(this);
    });
  }

}).call(this);