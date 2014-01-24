import Entity from '../core/entity';
import DebrisBehavior from '../behaviors/debris_behavior';
import ProjectilePhysicsBehavior from '../behaviors/projectile_physics_behavior';
import Actor from '../core/actor';
import { entity, ref } from '../core/game';

var Projectile = Entity.define({
  behaviors: [
    [ProjectilePhysicsBehavior, { collisionEvent: 'explode' }], // Should be if authority or simulated
    [DebrisBehavior,            { position: entity('position'), executeOn: 'explode' }, !global.isNode]
  ],

  actor: {
    typeName:   'projectile',
    role:       global.isNode ? Actor.Role.AUTHORITY : Actor.Role.SIMULATED,
    remoteRole: global.isNode ? Actor.Role.SIMULATED : Actor.Role.AUTHORITY
  },

  initialize: function Projectile() {
    var self = this;

    this.on('explode', function() {
      self.onExplode();
    });
  },

  onExplode: function() {
    this.getWorld().trigger('explosion', [{
      owner: this.get('owner'),
      position: this.get('position'),
      color: this.get('color')
    }, true]); // true means network event

    this.getWorld().remove(this);
  }
});

export default = Projectile;
