var Projectile = (function() {
  return makeStatefulComponent(Projectile);

  function didRemove(world) {
    var debrisCount = Math.floor(Math.random() * 5 + 10);
    for (var i = 0; i < debrisCount; i++) {
      world.add(new Debris({
        position: this.get('position'),
        size: [10, 4],
        randomSize: Math.random()
      }));
    }
  }

  function Projectile() {
    this.didRemove = didRemove;
  }

}).call(this);