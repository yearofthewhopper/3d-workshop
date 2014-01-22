import Entity from '../core/entity';
import Vector3Copy from '../behaviors/vector3_copy_behavior';
import ProjectileRenderer from '../behaviors/renderers/projectile_renderer';
import PlaySound from '../behaviors/renderers/play_sound_behavior';
import ExplosionBehavior from '../behaviors/explosion_behavior';
import SmokeRenderer from '../behaviors/renderers/smoke_renderer';
import DebrisBehavior from '../behaviors/debris_behavior';
import Actor from '../behaviors/actor';
import { entity, ref } from '../core/game';

var Projectile = Entity.define({
  behaviors: [
    [Vector3Copy,        { keys: ['position'] }],
    [ProjectileRenderer, { position: entity('position'), color: ref('color') }],
    [PlaySound,          { soundName: 'fire', onEvent: 'didInitialize', position: entity('position') }],
    [ExplosionBehavior,  { position: entity('position'), color: ref('color'), executeOn: 'explode' }],
    [SmokeRenderer,      { position: entity('position') }],
    [DebrisBehavior,     { position: entity('position'), executeOn: 'explode' }],
    [Actor,              { type: 'Projectile', role: ref('role'), remoteRole: ref('remoteRole') }]
  ],

  initialize: function Projectile() {
    this.color = players[this.get('id')].color;
  },

  role: function() {
    if (true) { //client
      return Actor.Role.SIMULATED;
    } else {
      return Actor.Role.AUTHORITY;
    }
  },

  remoteRole: function() {
    if (true) { //client
      return Actor.Role.AUTHORITY;
    } else {
      return Actor.Role.SIMULATED;
    }
  }
});

export default = Projectile;
