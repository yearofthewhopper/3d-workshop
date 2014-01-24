import { THREE } from 'three';
import Behavior from '../core/behavior';

var ProjectilePhysicsBehavior = Behavior.define({
  initialize: function ProjectilePhysicsBehavior() {
    this.gravity = new THREE.Vector3(0, -20, 0);
    this.wind = new THREE.Vector3(0, 0, 0);
  },

  onMessage: function(eventName, data) {
    if (eventName === 'tick') {
      this.tick(data);
    }
  },

  tick: function(delta) {
    var velocity = new THREE.Vector3().fromArray(this.get('velocity'));
    var position = new THREE.Vector3().fromArray(this.get('position'));

    velocity.add(this.gravity.clone().add(this.wind));
    position.add(velocity.clone().multiplyScalar(delta));

    var groundHeight = terrain.getGroundHeight(position.x, position.z);
    
    if (position.y < 0 || position.y < groundHeight) {
      var normal = terrain.getGroundNormal(position.x, position.z);

      position.y = groundHeight;
      velocity.reflect( normal );
      velocity.negate();
      // console.log("Post-reflect:", velocity.toArray() );
      velocity.multiplyScalar(0.6);
      
      this.set('bounces', this.get('bounces') + 1);
    }

    this.set('velocity', velocity.toArray());

    if (this.get('bounces') > 0){
      position.y = Math.max(groundHeight + 1, position.y);
      this.set('position', position.toArray());
      this.trigger(this.getOption('collisionEvent'));
    } else {
      this.set('position', position.toArray());
    }
  }
});

export default = ProjectilePhysicsBehavior;
