import Behavior from '../core/behavior';
import Explosion from '../entities/explosion';

var ExplosionBehavior = Behavior.define({
  execute: function() {
    this.getWorld().add(new Explosion({
      position: this.getOption('position'),
      color: this.getOption('color')
    }));
  },

  onMessage: function(eventName, data) {
    if (eventName === this.getOption('executeOn')) {
      this.execute.apply(this, data);
    }
  }
});

export default = ExplosionBehavior;
