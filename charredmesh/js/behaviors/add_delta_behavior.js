import Behavior from '../core/behavior';

export default = Behavior.define({
  initialize: function() {
    this.max = this.getOption('max') || Infinity;
    this.frequency = this.getOption('frequency') || (1 / 60); // 60fps-ish
    this.deltaBuffer = 0.0;
  },

  events: {
    'tick': 'onTick'
  },

  onTick: function(delta) {
    this.deltaBuffer += delta;

    if (this.deltaBuffer < this.frequency) {
      return;
    }

    var builtDelta = 0;
    while (this.deltaBuffer >= this.frequency){
      this.deltaBuffer -= this.frequency;
      builtDelta += this.frequency;
    }

    var varName = this.getOption('varName');
    var time = this.get(varName);

    if (time > this.max) {
      this.trigger(this.getOption('eventName'), [this]);
      this.disable();
      return;
    }

    this.set(varName, time + builtDelta);
  }
});
