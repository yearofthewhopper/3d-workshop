var Debris = (function() {
  return GameObject.define(
    Debris,
    withVector('position', 'velocity', 'rotation', 'angularVelocity'),
    withComponents(
      IncrementDeltaBehavior({ varName: 'time', max: function() { return this.entity.get('lifeSpan') }, eventName: 'removeDebris' }),
      PhysicsBehavior({ aboveWater: aboveWater })));

  function aboveWater(pos) {
    pos = pos || this.entity.get('position');
    return pos[1] > 40;
  }

  function tick(delta) {
    var pos = this.get('position');
    if (this.aboveWater && !aboveWater(pos)) {
      this.world.add(new Splash({
        position: pos
      }));

      this.aboveWater = false;
    }
  }

  function Debris() {
    this.on('before:initialize', function() {
      this.params.time = 0;
      this.params.lifeSpan = Math.random() * 4 + 3;
      this.params.position[1] -= 20;

      this.aboveWater = true;

      var launchNormal = terrain.getGroundNormal(this.params.position[0], this.params.position[2]);
      launchNormal.x += Math.random() - 0.5;
      launchNormal.y += Math.random() - 0.5;
      launchNormal.z += Math.random() - 0.5;
      launchNormal.normalize();
      launchNormal.normalize().multiplyScalar((1-this.params.randomSize) * 350 + 100);
      this.params.velocity = launchNormal.toArray();

      var angularVelocity = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      angularVelocity.multiplyScalar((1.5-this.params.randomSize) * 20);
      this.params.angularVelocity = angularVelocity.toArray();
    });

    this.on('tick', tick);

    this.on('removeDebris', function() {
      this.world.remove(this);
    });
  }

}).call(this);