var Debris = (function() {
  return makeStatefulComponent(Debris,
    withVector('position', 'velocity', 'rotation', 'angularVelocity'));

  function tick(delta) {
    var newTime = this.get('time') + delta;
    if (newTime > this.get('lifeSpan')) {
      this.world.remove(this);
      return;
    }

    this.set('time', newTime);

    var position = this.getPositionVector().clone();
    
    var groundHeight = terrain.getGroundHeight(position.x, position.z);

    var velocity = this.getVelocityVector().clone();
    velocity.y -= (300 * delta);
    
    position.add(velocity.clone().multiplyScalar(delta));

    var angularVelocity = this.getAngularVelocityVector().clone();

    var rotation = this.getRotationVector().clone();
    rotation.add(angularVelocity.clone().multiplyScalar(delta));

    if (position.y < 0 || position.y < groundHeight) {
      var normal = terrain.getGroundNormal(position.x, position.z);
      var above = position.y > 40;
      position.y = groundHeight;
      velocity.reflect( normal );
      velocity.negate();
      velocity.multiplyScalar(above ? 0.6 : 0.1);
      angularVelocity.multiplyScalar(above ? 0.76 : 0.1);
    }

    this.set('rotation', rotation.toArray());
    this.set('position', position.toArray());
    this.set('velocity', velocity.toArray());
    this.set('angularVelocity', angularVelocity.toArray());
  }

  function Debris() {
    var counter = 0;

    this.before('initialize', function(debrisData) {
      debrisData.id = counter++;
      debrisData.time = 0;
      debrisData.lifeSpan = Math.random() * 4 + 3;
      debrisData.position[1] -= 20;

      var launchNormal = terrain.getGroundNormal(debrisData.position[0], debrisData.position[2]);
      launchNormal.x += Math.random() - 0.5;
      launchNormal.y += Math.random() - 0.5;
      launchNormal.z += Math.random() - 0.5;
      launchNormal.normalize();
      launchNormal.normalize().multiplyScalar((1-debrisData.randomSize) * 350 + 100);
      debrisData.velocity = launchNormal.toArray();

      var angularVelocity = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      angularVelocity.multiplyScalar((1.5-debrisData.randomSize) * 20);
      debrisData.angularVelocity = angularVelocity.toArray();
    });

    this.tick = tick;

    this.didAdd = function(world) {
      this.world = world;
    };

    this.didRemove = function() {
      this.world = null;
    };
  }

}).call(this);