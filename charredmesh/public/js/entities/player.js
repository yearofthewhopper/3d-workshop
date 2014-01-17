var Player = (function() {
  return GameObject.define(
    Player,
    withVector('position', 'rotation', 'velocity'));

  function onPlayerDied(id) {
    if (id === this.get('id')) {
      this.set('visible', false);
    }
  }

  function onPlayerSpawned(data) {
    if (data.id === this.get('id')) {
      this.set('visible', true);
    }
  }

  function tick(delta) {
    var velocity = this.lastPositionVector.clone().sub(this.getPositionVector());
    this.set('velocity', velocity.toArray());

    var pos = this.get('position');

    if ((pos[1] < 40) && (this.lastPositionVector.y > 40)) {
      world.add(new Splash({
        position: pos
      }));
    }

    this.lastPositionVector.fromArray(pos);
  }

  function Player() {
    this.on('playerDied', onPlayerDied);
    this.on('playerSpawned', onPlayerSpawned);

    this.on('before:initialize', function() {
      this.lastPositionVector = new THREE.Vector3();
    })
  }
}).call(this);
