var PlaySoundBehavior = (function() {
  return makeBehavior(PlaySoundBehavior);

  function onName(eventName) {
    return 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
  }

  function PlaySoundBehavior() {
    var positionFunc = function() {
      return this.entity.get('position');
    };

    if (this.options.position) {
      positionFunc = this.options.position;
    }

    this[onName(this.options.onEvent)] = function() {
      var position = ('function' === typeof positionFunc) ? positionFunc.call(this) : positionFunc;

      charredmesh.sound.playSound(this.options.soundName, position);
    };
  }
}).call(this);
