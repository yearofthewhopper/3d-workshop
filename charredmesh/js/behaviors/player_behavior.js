import Behavior from '../core/behavior';

var PlayerBehavior = Behavior.define({
  initialize: function PlayerBehavior() {
  },

  onMessage: function(eventName, data) {
    if (eventName === 'tick') {
      this.tick.apply(this, data);
    }
  },

  tick: function(delta) {
    this.checkHealth(delta);

    if (this.get('alive')) {
      this.runPhysics(delta);
    } else {
      this.set('respawnTimer', this.get('respawnTimer') - delta);
      if (this.get('respawnTimer') <= 0) {
        // respawnPlayer(player);
      }
    }
  },

  checkHealth: function() {
    if (this.get('alive') && (this.get('health') <= 0)) {
      // dead.
      this.set('alive', false);
      this.set('respawnTimer', 5);
      this.getWorld().trigger('playerDied', [this.get('id'), true]);
    }
  },

  runPhysics: function(delta) {
    var maxVelocity = 675;

    var impulse = new THREE.Vector3();

    if (player.input.left) {
      player.rotation += delta * rotationDelta;
    }

    if (player.input.right) {
      player.rotation -= delta * rotationDelta;
    }

    if (player.input.turretLeft){
      player.turretAngle += delta * 1;
    }
    if (player.input.turretRight){
      player.turretAngle -= delta * 1;
    }
    
    if (player.velocity.length() > maxVelocity){
      player.velocity.setLength(maxVelocity);
    }    

    var thrust = new THREE.Vector3();
    
    var ground = terrain.getGroundHeight(player.position.x, player.position.z);
    var onGround = (player.position.y - ground) < 0.25;
    
    player.isDriving = (player.input.forward || player.input.back) && (onGround);
    
    if(onGround) {

      var UP = new THREE.Vector3(0, 1, 0);
      var directionQuat = new THREE.Quaternion();
      directionQuat.setFromAxisAngle(UP, player.rotation);
      var norm = terrain.getGroundNormal(player.position.x, player.position.z);
      norm.normalize();

      player.up.copy(norm);

      var angle = UP.angleTo(norm);
      var axis = UP.clone().cross(norm);
      player.forward.set(0, 0, 1);

      normQuat = new THREE.Quaternion();
      normQuat.setFromAxisAngle(axis, angle);
      normQuat.normalize();
      directionQuat.normalize();
     
      player.forward.applyQuaternion( normQuat.multiply(directionQuat) );

      if (player.input.forward) {
        thrust.copy( player.forward.clone().multiplyScalar(forwardDelta) );
      }

      if (player.input.back) {
        thrust.copy( player.forward.clone().multiplyScalar(forwardDelta * 0.5).negate() );
      }

      if(player.position.y < SEA_LEVEL){
        thrust.multiplyScalar(0.75);
      }

      var up = new THREE.Vector3(0,1,0);
      var normal = terrain.getGroundNormal(player.position.x, player.position.z);
      var slope = normal.dot(up);

      // limit movement on slopes (and slide down)
      if(slope < 0.85 && onGround){

        slope = (slope / 0.85);
        var slide = terrain.getGroundNormal(player.position.x, player.position.z).cross(up);
        slide = slide.cross(normal);

        var resistance = slide.dot(player.forward);
        
        
        thrust.multiplyScalar(1 - resistance);
        thrust.sub( slide.multiplyScalar((1 - slope) * forwardDelta));
      }

      var targetOrientationMatrix = new THREE.Matrix4().makeRotationAxis(player.up.clone().normalize().negate(), player.rotation);
      var targetOrientation = new THREE.Quaternion().setFromRotationMatrix(targetOrientationMatrix);

      player.orientation.copy(targetOrientation);
      
      player.barrelDirection.copy( player.forward );
      player.barrelDirection.applyAxisAngle( player.up, player.turretAngle );
      
      var barrelAxis = player.up.clone().cross( player.barrelDirection );

      player.barrelDirection.applyAxisAngle( barrelAxis, -player.barrelAngle );
      
      impulse.add(thrust);
    }
    
    player.velocity.add(impulse);
    player.velocity.add(gravity);

    if(onGround) {
      player.velocity.x *= 0.65;
      player.velocity.z *= 0.65;
    }

    player.position.add(player.velocity.clone().multiplyScalar(delta));

    ground = terrain.getGroundHeight(player.position.x, player.position.z);
    
    if(player.position.y < ground){
      player.position.y = ground;
      player.velocity.y = 0;
    }


    if (player.input.up) {
      player.barrelAngle = Math.min(turretMax, player.barrelAngle + delta * turretDelta);
    }

    if (player.input.down) {
      player.barrelAngle = Math.max(turretMin, player.barrelAngle - delta * turretDelta);
    }
  }
});

function respawnPlayer(player){
  player.alive = true;
  player.health = 100;
  player.position.set(
    Math.random() * worldBounds.x * 0.6 + worldBounds.x * 0.2,
    0,
    Math.random() * worldBounds.z * 0.6 + worldBounds.z * 0.2);

  // socketio.sockets.emit("playerSpawned", serializePlayer(player));
}