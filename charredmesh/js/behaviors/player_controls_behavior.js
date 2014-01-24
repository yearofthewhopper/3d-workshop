import Behavior from '../core/behavior';

var KEYBOARD = {
  SPACE: 32,
  W:     87,
  S:     83,
  A:     65,
  D:     68,
  R:     82,
  F:     70,
  UP:    38,
  DOWN:  40,
  RIGHT: 39,
  LEFT:  37
};

var EVENTMAP = {};
EVENTMAP[KEYBOARD.SPACE] = 'fire';
EVENTMAP[KEYBOARD.W]     = 'forward';
EVENTMAP[KEYBOARD.S]     = 'back';
EVENTMAP[KEYBOARD.A]     = 'left';
EVENTMAP[KEYBOARD.D]     = 'right';
EVENTMAP[KEYBOARD.R]     = 'up';
EVENTMAP[KEYBOARD.F]     = 'down';
EVENTMAP[KEYBOARD.UP]    = 'up';
EVENTMAP[KEYBOARD.DOWN]  = 'down';
EVENTMAP[KEYBOARD.RIGHT] = 'turretRight';
EVENTMAP[KEYBOARD.LEFT]  = 'turretLeft';

var PlayerControlsBehavior = Behavior.define({
  initialize: function PlayerControlsBehavior() {
  },

  onMessage: function(eventName, data) {
    if (eventName === 'inputChange') {
      this.onInputChange(data.code, data.state);
    }
  },

  onInputChange: function(code, state) {
    var eventName = EVENTMAP[code];
    socket.emit('playerInput', { eventName: eventName, state: state });
    // this.trigger('inputChange', [{ eventName: eventName, state: state }]);
  }
});

export default = PlayerControlsBehavior;
