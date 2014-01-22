import Behavior from '../core/behavior';

var Actor = Behavior.define({
  initialize: function() {
    this.entity.actor = this;
    this.isDirty = false;
  },

  becameDirty: function() {
    this.isDirty = true;
  },

  becameClean: function() {
    this.isDirty = false;
  },

  receiveState: function(params) {
    this.sync(params);
  },

  onMessage: function(eventName, data) {
    var role = this.getOption('role');
    var remoteRole = this.getOption('remoteRole');

    if ((role === Actor.Role.AUTHORITY) &&
        (remoteRole !== Actor.Role.NONE)) {
      if (eventName === 'stateChange') {
        this.becameDirty();
      }
    } else if (eventName === 'sentActorUpdate') {
      this.becameClean();
    }
  },

  tearOff: function() {

  }
});

Actor.Role = {
  AUTHORITY: 1,
  AUTONOMOUS: 2,
  SIMULATED: 3,
  NONE: 0
};

export default = Actor;
