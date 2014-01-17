var IncrementDeltaBehavior = (function() {
  return makeBehavior(IncrementDeltaBehavior);

  function tick(delta) {
    if (!this.running) {
      return;
    }

    var time = this.entity.get(this.options.varName);

    var max;
    if (this.options.max) {
      max = ('function' === typeof this.options.max) ? this.options.max.call(this) : this.options.max;
    } else {
      max = Infinity;
    }

    if (time > max) {
      this.entity.trigger(this.options.eventName, this);
      this.running = false;
      return;
    }

    this.entity.set(this.options.varName, time + delta);
  }

  function IncrementDeltaBehavior() {
    this.onTick = tick;
    this.on('after:initialize', function() {
      this.running = true;
    });
  }
}).call(this);