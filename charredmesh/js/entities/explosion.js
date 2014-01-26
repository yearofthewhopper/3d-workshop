import Entity from '../core/entity';
import AddDelta from '../behaviors/add_delta_behavior';

export default = Entity.define({

  behaviors: [
    [AddDelta, { varName: 'time', max: 1, eventName: 'explosionComplete' }]
  ],

  events: {
    'explosionComplete': 'remove'
  },

  initialize: function Explosion() {
    this.set('time', 0);
  }

});
