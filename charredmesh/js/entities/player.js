import Entity from '../core/entity';
import Vector3Copy from '../behaviors/vector3_copy_behavior';
import Splash from '../entities/splash';
import Actor from '../core/actor';
import { entity } from '../core/game';

var Player = Entity.define({
  behaviors: [
    [Vector3Copy, { keys: ['position', 'rotation', 'velocity'] }]
  ],

  // actor: {
  //   typeName:   'player',
  //   role:       global.isNode ? Actor.Role.AUTHORITY : Actor.Role.SIMULATED,
  //   remoteRole: global.isNode ? Actor.Role.SIMULATED : Actor.Role.AUTHORITY
  // },

  initialize: function Player() {
    this.lastPositionVector = new THREE.Vector3();

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

    // this.on('playerFire', function(params) {
    //   self.onPlayerFire(params);
    // });
  },

  // onPlayerFire: function(params) {
  //   if (this.get('alive') && !gameState.projectiles[player.id]) {

  //     var direction = player.barrelDirection.clone();

  //     var position = player.position.clone();
      
  //     position.y += playerHeight;
  //     position.add(direction.clone().multiplyScalar(barrelLength));
      
  //     var power = basePower + (params.power * basePower);

  //     world.add(new Projectile({
  //       owner: player.id,
  //       position: position.toArray(),
  //       velocity: direction.clone().multiplyScalar(power).toArray(),
  //       bounces : 0,
  //       state: "flying",
  //       color: owner.color
  //     }));
  //   }
  // },

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

    var velocity = this.lastPositionVector.clone().sub(posVec);
    this.set('velocity', velocity.toArray());

    if ((pos[1] < 40) && (this.lastPositionVector.y > 40)) {
      this.getWorld().add(new Splash({
        position: pos
      }));
    }

    this.lastPositionVector.fromArray(pos);
  }
});

Player.FIRING_STATE = {
  NONE: 1,
  CHARGING: 2,
  FIRING: 3
};

export default = Player;
