import Entity from '../core/entity';
import AddDelta from '../behaviors/add_delta_behavior';

export default = Entity.define({
  behaviors: [
    [AddDelta, { varName: 'time', max: 2, eventName: 'splashComplete' }]
  ],

  events: {
    'splashComplete': 'remove'
  },

  initialize: function Splash() {
    this.set('time', 0);
    this.set('spin', (Math.random() - 0.5) * 0.02);
    this.set('speed', Math.random() * 5 + 10);
  }
});
