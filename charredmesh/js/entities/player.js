import Entity from '../core/entity';
import Vector3Copy from '../behaviors/vector3_copy_behavior';
import PlayerInputBehavior from '../behaviors/player_input_behavior';
import PlayerControlsBehavior from '../behaviors/player_controls_behavior';
import PlayerBehavior from '../behaviors/player_behavior';
import TakeDamageBehavior from '../behaviors/take_damage_behavior';
import Splash from '../entities/splash';
import Actor from '../core/actor';
import { property, ref } from '../core/game';
import { THREE } from 'three';

// Compose API
function isClient() { return !global.isNode; };

function isServer() { return global.isNode; };

function and(f, g) {
  return function() {
    return f.apply(this.arguments) && f.apply(this, arguments);
  }
}

function or(f, g) {
  return function() {
    return f.apply(this.arguments) || f.apply(this, arguments);
  }
}

export default = Entity.define({
  behaviors: [
    [Vector3Copy, { keys: ['position', 'rotation', 'velocity'] }],
    [PlayerInputBehavior, {}, isServer],
    [PlayerControlsBehavior, {}, and(isClient, ref('isCurrentPlayer'))],
    [PlayerBehavior, { onGround: ref('onGround') }, isServer],
    [TakeDamageBehavior, { playerPosition: property('position'), onEvent: 'explosion' }, and(isServer, property('alive'))]
  ],

  actor: {
    typeName:   'player',
    role:       global.isNode ? Actor.Role.AUTHORITY : Actor.Role.AUTONOMOUS,
    remoteRole: global.isNode ? Actor.Role.AUTONOMOUS : Actor.Role.AUTHORITY
  },

  isCurrentPlayer: function() {
    return this.getWorld().get('currentPlayerId') === this.get('id');
  },

  onGround: function() {
    var pos = this.get('position');
    var ground = terrain.getGroundHeight(pos[0], pos[2]);
    return (pos[1] - ground) < 0.25;
  },

  initialize: function Player() {
    console.log(this.get('name') + " has entered the game!");
    this.lastPosition = [0,0,0];

    var self = this;

    this.on('tick', function(delta) {
      self.tick(delta);
    });

    this.on('playerDied', function(id) {
      self.onPlayerDied(id)
    });

    this.on('playerSpawned', function(data) {
      self.onPlayerSpawned(data.id)
    });
  },

  onPlayerDied: function(id) {
    if (id === this.get('id')) {
      this.set('visible', false);
    }
  },

  onPlayerSpawned: function(id) {
    if (id === this.get('id')) {
      this.set('visible', true);
    }
  },

  tick: function(delta) {
    var pos = this.get('position');
    var posVec = new THREE.Vector3().fromArray(pos);
    var lastPositionVector = new THREE.Vector3().fromArray(this.lastPosition);

    var velocity = lastPositionVector.clone().sub(posVec);
    this.set('velocity', velocity.toArray());

    if ((pos[1] < 40) && (lastPositionVector.y > 40)) {
      this.getWorld().add(new Splash({
        position: pos
      }));
    }

    this.lastPosition = pos;
  }
});
