import Behavior from '../core/behavior';
import { THREE } from 'three';

var maxVelocity = 675;
var rotationDelta   = 1;

var PlayerBehavior = Behavior.define({
  initialize: function PlayerBehavior() {
    this.input = {};
  },

  onMessage: function(eventName, data) {
    if (eventName === 'tick') {
      this.tick(data);
    } else if (eventName === 'inputUpdated') {
      updateInput(data);
    }
  },

  updateInput: function(input) {
    this.input = input;
  },

  tick: function(delta) {
    this.checkHealth(delta);

    if (this.get('alive')) {
      this.runPhysics(delta);
    } else {
      this.set('respawnTimer', this.get('respawnTimer') - delta);
      if (this.get('respawnTimer') <= 0) {
        this.respawn();
      }
    }
  },

  checkHealth: function() {
    if (this.get('alive') && (this.get('health') <= 0)) {
      this.died();
    }
  },

  died: function() {
    this.set('alive', false);
    this.set('respawnTimer', 5);
    this.getWorld().trigger('playerDied', [
      {
        id: this.get('id'),
        position: this.get('position')
      },
      true // Network event
    ]);
  },

  runPhysics: function(delta) {
    var velocity = new THREE.Vector3().fromArray(this.get('velocity'));
    var position = new THREE.Vector3().fromArray(this.get('position'));

    var impulse = new THREE.Vector3();
    var thrust = new THREE.Vector3();

    if (this.input.left) {
      this.set('rotation', this.get('rotation') + (delta * rotationDelta));
    }

    if (this.input.right) {
      this.set('rotation', this.get('rotation') - (delta * rotationDelta));
    }

    if (this.input.turretLeft){
      this.set('turretAngle', this.get('turretAngle') + (delta * 1));
    }

    if (this.input.turretRight){
      this.set('turretAngle', this.get('turretAngle') - (delta * 1));
    }
    
    if (velocity.length() > maxVelocity){
      velocity.setLength(maxVelocity);
    }
    
    var ground = terrain.getGroundHeight(position.x, position.z);
    var onGround = (position.y - ground) < 0.25;
    
    this.set('driving', (this.input.forward || this.input.back) && (onGround));
    
    if (onGround) {
      var rotation = this.get('rotation');

      var UP = new THREE.Vector3(0, 1, 0);
      var directionQuat = new THREE.Quaternion();
      directionQuat.setFromAxisAngle(UP, rotation);
      var norm = terrain.getGroundNormal(position.x, position.z);
      norm.normalize();

      var playerUp = new THREE.Vector3().copy(norm);

      var angle = UP.angleTo(norm);
      var axis = UP.clone().cross(norm);
      var forward = new THREE.Vector3(0, 0, 1);

      normQuat = new THREE.Quaternion();
      normQuat.setFromAxisAngle(axis, angle);
      normQuat.normalize();
      directionQuat.normalize();
     
      forward.applyQuaternion(normQuat.multiply(directionQuat));

      if (this.input.forward) {
        thrust.copy(forward.clone().multiplyScalar(forwardDelta));
      }

      if (this.input.back) {
        thrust.copy(forward.clone().multiplyScalar(forwardDelta * 0.5).negate());
      }

      if(position.y < SEA_LEVEL){
        thrust.multiplyScalar(0.75);
      }

      var up = new THREE.Vector3(0,1,0);
      var normal = terrain.getGroundNormal(position.x, position.z);
      var slope = normal.dot(up);

      // limit movement on slopes (and slide down)
      if (slope < 0.85 && onGround) {

        slope = (slope / 0.85);
        var slide = terrain.getGroundNormal(position.x, position.z).cross(up);
        slide = slide.cross(normal);

        var resistance = slide.dot(forward);
        
        thrust.multiplyScalar(1 - resistance);
        thrust.sub(slide.multiplyScalar((1 - slope) * forwardDelta));
      }

      var targetOrientationMatrix = new THREE.Matrix4().makeRotationAxis(playerUp.clone().normalize().negate(), rotation);
      var targetOrientation = new THREE.Quaternion().setFromRotationMatrix(targetOrientationMatrix);

      this.set('orientation', targetOrientation.toArray());
      
      var barrelDirection = new THREE.Vector3().fromArray(this.get('barrelDirection'));
      barrelDirection.copy(forward);
      barrelDirection.applyAxisAngle(playerUp, this.get('turretAngle'));
      
      var barrelAxis = playerUp.clone().cross(barrelDirection);

      barrelDirection.applyAxisAngle(barrelAxis, -this.get('barrelAngle'));
      
      impulse.add(thrust);

      this.set('up', playerUp)
    }
    
    velocity.add(impulse);
    velocity.add(gravity);

    if (onGround) {
      velocity.x *= 0.65;
      velocity.z *= 0.65;
    }

    position.add(velocity.clone().multiplyScalar(delta));

    ground = terrain.getGroundHeight(position.x, position.z);
    
    if (position.y < ground){
      position.y = ground;
      velocity.y = 0;
    }

    if (this.input.up) {
      this.set('barrelAngle', Math.min(turretMax, this.get('barrelAngle') + (delta * turretDelta)));
    }

    if (this.input.down) {
      this.set('barrelAngle', Math.max(turretMin, this.get('barrelAngle') - (delta * turretDelta)));
    }

    this.set('velocity', velocity.toArray());
    this.set('position', position.toArray());
    this.set('forward', forward.toArray());
    this.set('barrelDirection', barrelDirection.toArray);
  },

  respawn: function(player){
    this.set('alive', true);
    this.set('health', 100);
    this.set('position', [
      Math.random() * worldBounds.x * 0.6 + worldBounds.x * 0.2,
      0,
      Math.random() * worldBounds.z * 0.6 + worldBounds.z * 0.2
    ]);

    this.getWorld().trigger('playerSpawned', [
      {
        id: this.get('id'),
        position: this.get('position')
      },
      true // Network event
    ]);
  }
});
