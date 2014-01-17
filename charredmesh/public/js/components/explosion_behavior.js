var ExplosionBehavior = (function() {
  return makeBehavior(ExplosionBehavior);

  function execute(eventData) {
    var pos = (eventData && eventData.position) || this.entity.get('position');

    world.add(new Explosion({
      position: pos,
      color: players[this.entity.get('id')].color
    }));
  }

  function ExplosionBehavior() {
    this.execute = execute;
  }
}).call(this);