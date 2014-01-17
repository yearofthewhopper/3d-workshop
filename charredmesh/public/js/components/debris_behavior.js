var DebrisBehavior = (function() {
  return makeBehavior(DebrisBehavior);

  function execute(eventData) {
    var pos = (eventData && eventData.position) || this.entity.get('position');

    var debrisCount = Math.floor(Math.random() * 5 + 10);
    for (var i = 0; i < debrisCount; i++) {
      world.add(new Debris({
        position: pos,
        size: [10, 4],
        randomSize: Math.random()
      }));
    }
  }

  function DebrisBehavior() {
    this.execute = execute;
  }
}).call(this);