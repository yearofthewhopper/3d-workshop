import Behavior from '../core/behavior';
import Projectile from '../entities/projectile';
import { THREE } from 'three';

var playerHeight = 17;
var basePower    = 1000;
var FIRING_STATE = {
  NONE: 1,
  CHARGING: 2,
  FIRING: 3
};

var PlayerInputBehavior = Behavior.define({
  initialize: function PlayerInputBehavior() {
    this.currentTime = 0;

    this.previousFirePower = 0;
    this.firePower = 0;
    this.firingState = FIRING_STATE.NONE;
    this.fireTimer = 0;

    this.input = {
      fire: false,
      forward: false,
      back: false,
      left: false,
      right: false,
      up: false,
      down: false
    };
  },

  onMessage: function(eventName, data) {
    if (eventName === 'playerInput') {
      this.onInput(data.eventName, data.state);
    } else if (eventName === 'tick') {
      this.onTick(data);
    } else if (eventName === 'explosion') {
      this.onExplosion(data);
    }
  },

  onInput: function(eventName, state) {
    this.input[eventName] = state;

    if (this.get('alive')) {
      if (state && this.firingState == FIRING_STATE.NONE) {
        this.fireTimer = this.currentTime;
        this.firingState = FIRING_STATE.CHARGING;
      }

      if (!state && this.firingState == FIRING_STATE.CHARGING) {
        this.fire();
      }
    }

    this.trigger('inputUpdated', [this.input]);
  },

  fire: function() {
    this.previousFirePower = this.firePower;
    this.firingState = FIRING_STATE.FIRING;

    var barrelLength = 60;

    var direction = new THREE.Vector3().fromArray(this.get('barrelDirection'));
    var position = new THREE.Vector3().fromArray(this.get('position'));
    
    position.y += playerHeight;
    position.add(direction.clone().multiplyScalar(barrelLength));
    
    var power = basePower + (this.firePower * basePower);

    this.createEntity(Projectile, {
      owner: this.get('id'),
      position: this.get('position'),
      velocity: direction.clone().multiplyScalar(power).toArray(),
      bounces: 0,
      state: "flying",
      color: this.get('color')
    });

    // For sounds, maybe?
    this.getWorld().trigger('playerFire', [
      {
        position: this.get('position')
      },
      true // Network Event
    ]);
  },

  onExplosion: function(explosion) {
    if (this.get('id') === explosion.owner) {
      this.firingState = FIRING_STATE.NONE;
    }
  },

  onTick: function(delta) {
    this.currentTime += delta;

    if (this.input.fire) {
      var firePower = Math.sin((this.currentTime - this.fireTimer) + (3 * Math.PI / 2));
      this.firePower = (firePower + 1) / 2;
    }
  }
});

export default = PlayerInputBehavior;
