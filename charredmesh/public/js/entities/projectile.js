var Projectile = (function() {
  return GameObject.define(
  	Projectile,
    withComponents(
      DebrisBehavior({ eventMap: { onExplode: 'execute' } }),
      ExplosionBehavior({ eventMap: { onExplode: 'execute' } })));

  function Projectile() {

  }
}).call(this);