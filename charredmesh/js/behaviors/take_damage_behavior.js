import Behavior from '../core/behavior';
import Player from '../entities/player';
import { THREE } from 'three';

var playerHeight    = 17;
var explosionRadius = 450;
var maxDamage       = 50;

export default = Behavior.define({
  initialize: function TakeDamageBehavior() {
    var self = this;
    this.on(this.getOption('onEvent'), function(data) {
      self.projectileDamage(data);
    });
  },

  projectileDamage: function(projectile) {
    var collision = new THREE.Vector3().fromArray(projectile.position);
    collision.y += playerHeight * 0.5;

    var position = new THREE.Vector3().fromArray(this.getOption('playerPosition'));
    var distance = position.distanceTo(collision);
    
    if (distance >= explosionRadius) {
      return;
    }

    var health = this.get('health');
    health -= maxDamage * (1 - (distance / explosionRadius));
    health = Math.max(health, 0);
    this.set('health', health);
    
    if (health <= 0) {
      this.triggerNetwork('playerDidDie', {
        player: this.get('id'),
        killer: projectile.owner
      });

      if (this.get('id') === projectile.owner) {
        this.set('score', this.get('score') - 5);
      } else {
        var killer = this.getWorld().getEntity(Player, projectile.owner);
        killer.set('score', killer.get('score') + 1);
      }
    }
  }
});
