var Explosion = (function() {
  return GameObject.define(
    Explosion,
    withVector('position'),
    withComponents(
      PlaySoundBehavior({ soundName: 'explosion', onEvent: 'initialize', position: getPosition }),
      IncrementDeltaBehavior({ varName: 'time', max: 1, eventName: 'explosionComplete' }),
      ExplosionRenderer({ position: getPosition })));

  function getPosition() {
    return this.entity.getPositionVector();
  }

  function Explosion() {
    this.on('before:initialize', function() {
      this.params.time = 0;
    });

    this.on('explosionComplete', function() {
      this.world.remove(this);
    });
  }
}).call(this);
