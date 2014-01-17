var PhysicsBehavior = (function() {
  return makeBehavior(PhysicsBehavior);

  function tick(delta) {
    var position = this.entity.getPositionVector().clone();
    
    var groundHeight = terrain.getGroundHeight(position.x, position.z);

    var velocity = this.entity.getVelocityVector().clone();

    for (var i = 0; i < this.forces.length; i++) {
      var scaledForce = this.forces[i].clone().multiplyScalar(delta);
      velocity.add(scaledForce);
    }
    
    position.add(velocity.clone().multiplyScalar(delta));

    var trackingAngularVelocity = !!this.entity.get('angularVelocity');

    if (trackingAngularVelocity) {
      var angularVelocity = this.entity.getAngularVelocityVector().clone();

      var rotation = this.entity.getRotationVector().clone();
      rotation.add(angularVelocity.clone().multiplyScalar(delta));
    }

    var above = this.options.aboveWater.call(this);

    if (position.y < 0 || position.y < groundHeight) {
      var normal = terrain.getGroundNormal(position.x, position.z);
      position.y = groundHeight;
      velocity.reflect( normal );
      velocity.negate();
      velocity.multiplyScalar(above ? 0.6 : 0.1);

      if (trackingAngularVelocity) {
        angularVelocity.multiplyScalar(above ? 0.76 : 0.1);
      }
    }

    this.entity.set('position', position.toArray());
    this.entity.set('velocity', velocity.toArray());
    
    if (trackingAngularVelocity) {
      this.entity.set('rotation', rotation.toArray());
      this.entity.set('angularVelocity', angularVelocity.toArray());
    }
  }

  function PhysicsBehavior() {
    this.onTick = tick;
    this.on('after:initialize', function() {
      if (this.options.forces) {
        this.forces = this.options.forces;
      } else {
        // Default to "gravity"
        this.forces = [
          new THREE.Vector3(0, -300, 0)
        ];
      }
    });
  }
}).call(this);