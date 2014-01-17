var Sun = (function() {
  return GameObject.define(
    Sun,
    withComponents(
      IncrementDeltaBehavior({ varName: 'time' })));

  function Sun() {
    this.on('before:initialize', function() {
      this.positionVector = new THREE.Vector3();
      this.params.id = 'singleton';
      this.params.time = 0;
    });

    this.on('stateChange', function(info) {
      if (info.key === 'time') {
        this.positionVector.set(
          Math.cos(info.value * 0.01),
          Math.sin(info.value * 0.01),
          0
        );
      }
    });
  }
}).call(this);
