var AddDelta = Game.Behavior.define({
  initialize: function() {
    this.max = this.getOption('max') || Infinity;
  },

  tick: function(delta) {
    var varName = this.getOption('varName');
    var time = this.get(varName);

    if (time > this.max) {
      this.trigger(this.getOption('eventName'), [this]);
      this.disable();
      return;
    }
    
    this.set(varName, time + delta);
  },

  onMessage: function(eventName, data) {
    if (eventName === 'tick') {
      this.tick.apply(this, data);
    }
  }
});
