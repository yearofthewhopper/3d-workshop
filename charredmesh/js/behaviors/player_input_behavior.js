import Behavior from '../core/behavior';
import Player from '../entities/player';

var PlayerInputBehavior = Behavior.define({
  initialize: function PlayerInputBehavior() {
    this.time = 0;

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
      this.input = data;
    } else if ((eventName === 'inputChange') && !global.isNode) {
      if (this.get('id') === this.getWorld().get('currentPlayerId')) {
        this.onInputChange(data[0].code, data[0].state);
      }
    } else if ((eventName === 'tick') && !global.isNode) {
      this.onTick(data);
    }
  },

  onTick: function(delta) {
    this.time += delta;

    if (this.input.fire) {
      var firePower = Math.sin((time - this.getWorld().get('fireTimer')) + (3 * Math.PI / 2));
      this.getWorld().set('firePower', (firePower + 1) / 2);
    }
  },

  onInputChange: function(code, state) {
    var firingState = this.getWorld().get('firingState');
    
    switch(code) {
    case 32:
      if (state && firingState == Player.FIRING_STATE.NONE) {
        this.getWorld().sync({
          'fireTimer': time,
          'firingState': Player.FIRING_STATE.CHARGING
        });
      }

      if (!state && firingState == Player.FIRING_STATE.CHARGING) {
        var firePower = this.getWorld().get('firePower');
        this.getWorld().set('previousFirePower', firePower);
        socket.emit('playerFire', { "power" : firePower });
        this.getWorld().set('firingState', Player.FIRING_STATE.FIRING);
      }

      this.input.fire = state;
      return;
      break;
    case 87: // W
      this.input.forward = state;
      break;
    case 83: // S
      this.input.back = state;
      break;
    case 65: // A
      this.input.left = state;
      break;
    case 68: // D
      this.input.right = state;
      break;
    case 82: // R
    case 38: // Up arrow
      this.input.up = state;
      break;
    case 70: // F
    case 40: // down arrow
      this.input.down = state;
      break;

    case 39: // right arrow
      this.input.turretRight = state;
      break;
    
    case 37: // left arrow
      this.input.turretLeft = state;
      break;
    case 69: // e
      this.input.aim = state;
      break;
    }
    
    socket.emit('playerInput', this.input);
  }
});

export default = PlayerInputBehavior;
