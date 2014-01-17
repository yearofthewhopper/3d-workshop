var Sun = (function() {
  return makeStatefulComponent(Sun);

  function Sun() {
    this.initialize = function() {
      this.positionVector = new THREE.Vector3();
    };

    this.before('initialize', function(sunData) {
      sunData.id = 'singleton';
      sunData.time = 0;
    });

    this.after('tick', function(delta) {
      this.set('time', this.get('time') + delta);
    });

    this.after('stateChange', function(key, value) {
      if (key === 'time') {
        this.positionVector.set(
          Math.cos(value * 0.01),
          Math.sin(value * 0.01),
          0
        );
      }
    });
  }
}).call(this);
