import Entity from '../core/entity';
import AddDelta from '../behaviors/add_delta_behavior';
import { THREE } from 'three';

export default = Entity.define({
  behaviors: [
    [AddDelta, { varName: 'time', frequency: (1 / 30) }, global.isNode]
  ],

  // Provide a shared name to allow syncing.
  actor: {
    typeName: 'sun'
  },

  events: {
    'stateChange': 'updateVectorCache'
  },

  updateVectorCache: function(info) {
    if (!global.isNode && (info.key === 'time')) {
      var t = this.get('time');
      window.sunPosition.set(
        Math.cos(t * 0.01),
        Math.sin(t * 0.01),
        0
      );
    }
  }
});
