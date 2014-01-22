import Entity from '../core/entity';
import Vector3Copy from '../behaviors/vector3_copy_behavior';
import SplashRenderer from '../behaviors/renderers/splash_renderer';
import PlaySound from '../behaviors/renderers/play_sound_behavior';
import AddDelta from '../behaviors/add_delta_behavior';
import { entity } from '../core/game';

var Splash = Entity.define({
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

export default = Splash;
