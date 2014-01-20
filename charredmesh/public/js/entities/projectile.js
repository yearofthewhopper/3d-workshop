var Projectile = Game.Object.define({
  behaviors: [
    [Vector3Copy,        { keys: ['position'] }],
    [ProjectileRenderer, { position: entity('position'), color: ref('color') }],
    [PlaySound,          { soundName: 'fire', onEvent: 'didInitialize', position: entity('position') }],
    [ExplosionBehavior,  { position: entity('position'), color: ref('color'), executeOn: 'explode' }],
    [SmokeRenderer,      { position: entity('position') }],
    [DebrisBehavior,     { position: entity('position'), executeOn: 'explode' }]
  ],

  initialize: function Projectile() {
    this.color = players[this.get('id')].color;
  }
});
