var Player = Game.Object.define({
  behaviors: [
    [Vector3Copy,    { keys: ['position', 'rotation', 'velocity'] }],
    [PlayerRenderer, {}, entity('visible')],
    [DustRenderer,   { position: entity('position') }, entity('driving')]
  ],

  initialize: function Player() {
    this.lastPositionVector = new THREE.Vector3();

    var self = this;

    this.on('tick', function(delta) {
      self.tick(delta);
    });

    this.on('playerDied', function(id) {
      self.onPlayerDied(id)
    });

    this.on('playerSpawned', function(data) {
      self.onPlayerSpawned(data.id)
    });
  },

  onPlayerDied: function(id) {
    if (id === this.get('id')) {
      this.set('visible', false);
    }
  },

  onPlayerSpawned: function(id) {
    if (id === this.get('id')) {
      this.set('visible', true);
    }
  },

  tick: function(delta) {
    var pos = this.get('position');
    var posVec = new THREE.Vector3().fromArray(pos);

    var velocity = this.lastPositionVector.clone().sub(posVec);
    this.set('velocity', velocity.toArray());

    if ((pos[1] < 40) && (this.lastPositionVector.y > 40)) {
      this.getWorld().add(new Splash({
        position: pos
      }));
    }

    this.lastPositionVector.fromArray(pos);
  }
});
