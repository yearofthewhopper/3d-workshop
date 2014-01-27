import Behavior from '../core/behavior';

export default = Behavior.define({
  initialize: function PhysicsBehavior() {
    var forces = this.get('forces');
    if (forces) {
      this.forces = forces;
    } else {
      // Default to "gravity"
      this.forces = [
        new THREE.Vector3(0, -300, 0)
      ];
    }
  },

  events: {
    'tick': 'onTick'
  },

  onTick: function(delta) {
    var position = new THREE.Vector3().fromArray(this.get('position'));
    
    var groundHeight = terrain.getGroundHeight(position.x, position.z);

    var velocity = new THREE.Vector3().fromArray(this.get('velocity'));

    for (var i = 0; i < this.forces.length; i++) {
      var scaledForce = this.forces[i].clone().multiplyScalar(delta);
      velocity.add(scaledForce);
    }
    
    position.add(velocity.clone().multiplyScalar(delta));

    var trackingAngularVelocity = !!this.get('angularVelocity');

    if (trackingAngularVelocity) {
      var angularVelocity = new THREE.Vector3().fromArray(this.get('angularVelocity'));

      var rotation = new THREE.Vector3().fromArray(this.get('rotation'));
      rotation.add(angularVelocity.clone().multiplyScalar(delta));
    }

    var above = this.getOption('aboveWater');

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

    this.set('position', position.toArray());
    this.set('velocity', velocity.toArray());
    
    if (trackingAngularVelocity) {
      this.set('rotation', rotation.toArray());
      this.set('angularVelocity', angularVelocity.toArray());
    }
  }
});
