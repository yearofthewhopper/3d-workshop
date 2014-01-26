import Entity from '../core/entity';
import DebrisBehavior from '../behaviors/debris_behavior';
import ProjectilePhysicsBehavior from '../behaviors/projectile_physics_behavior';
import { entity } from '../core/game';

// Define an entity.
export default = Entity.define({

  // Provide a shared name to allow syncing.
  actor: {
    typeName: 'projectile'
  },

  // List of per-instance behaviors to additional functionality to the entity.
  behaviors: [
    [ProjectilePhysicsBehavior, { collisionEvent: global.isNode ? 'causeExplosion' : 'makeDebris' }],
    [DebrisBehavior,            { position: entity('position'), executeOn: 'makeDebris' }]
  ],

  // Map eventNames to local functions.
  events: {
    'causeExplosion': 'onExplode'
  },

  // On the `causeExplosion` event, from the physics behavior, notify the clients of an explosion.
  onExplode: function() {
    this.triggerNetwork('explosion', {
      owner: this.get('owner'),
      position: this.get('position'),
      color: this.get('color')
    });

    this.remove();
  }

});
