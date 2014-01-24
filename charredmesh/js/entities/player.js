import Entity from '../core/entity';
import Vector3Copy from '../behaviors/vector3_copy_behavior';
import PlayerInputBehavior from '../behaviors/player_input_behavior';
import Splash from '../entities/splash';
import Actor from '../core/actor';
import { entity } from '../core/game';
import { THREE } from 'three';

var Player = Entity.define({
  behaviors: [
    [Vector3Copy, { keys: ['position', 'rotation', 'velocity'] }],
    [PlayerInputBehavior, {}]
  ],

  actor: {
    typeName:   'player',
    role:       global.isNode ? Actor.Role.AUTHORITY : Actor.Role.AUTONOMOUS,
    remoteRole: global.isNode ? Actor.Role.AUTONOMOUS : Actor.Role.AUTHORITY
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

    // this.on('explosion', function() {
    //   self.projectileDamage();
    // });

    this.on('fire', function(power) {
      self.onPlayerFire(power);
    });
  },

  onPlayerFire: function(params) {
     // && !gameState.projectiles[player.id]
    var barrelLength    = 60;

    if (!this.get('alive')) { return; }

    var direction = new THREE.Vector3().fromArray(this.get('barrelDirection'));
    var position = new THREE.Vector3().fromArray(this.get('position'));
    
    position.y += playerHeight;
    position.add(direction.clone().multiplyScalar(barrelLength));
    
    var power = basePower + (power * basePower);

    this.getWorld().add(new Projectile({
      owner: player.id,
      position: this.get('position'),
      velocity: direction.clone().multiplyScalar(power).toArray(),
      bounces : 0,
      state: "flying",
      color: this.get('color')
    }));
  },

  // projectileDamage: function() {
  //   var collision = new THREE.Vector3().fromArray(this.get('position'));
  //   collision.y += playerHeight * 0.5;
    
      // var explosionRadius = 450;

  //   mapObject(function(player) {
  //     if(player.alive){
  //       var distance = player.position.distanceTo(collision);
        
  //       if (distance < explosionRadius) {
  //         player.health -= maxDamage * (1 - (distance / explosionRadius));
  //         player.health = Math.max(player.health, 0);
          
  //         if(player.health <= 0){
  //           if(player.id == projectile.owner) {
  //             gameState.players[projectile.owner].score -= 5;
  //           } else {
  //             gameState.players[projectile.owner].score++;
  //           }
  //         }
  //       }
  //     }
  //   }, gameState.players);
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

Player.FIRING_STATE = {
  NONE: 1,
  CHARGING: 2,
  FIRING: 3
};

export default = Player;
