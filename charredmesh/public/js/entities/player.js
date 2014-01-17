var Player = (function() {
  return makeStatefulComponent(Player, withVector('position'),
    withListeners('playerDied', 'playerSpawned'));

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

  function Player() {
    this.onPlayerDied = onPlayerDied;
    this.onPlayerSpawned = onPlayerSpawned;
  }
}).call(this);
