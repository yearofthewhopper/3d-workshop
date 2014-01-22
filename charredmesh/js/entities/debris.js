import Entity from '../core/entity';
import Vector3Copy from '../behaviors/vector3_copy_behavior';
import PhysicsBehavior from '../behaviors/physics_behavior';
import AddDelta from '../behaviors/add_delta_behavior';
import Splash from '../entities/splash';
import { entity, ref } from '../core/game';

var Debris = Entity.define({
  behaviors: [
    [Vector3Copy,     { keys: ['position', 'velocity', 'rotation', 'angularVelocity'] }],
    [PhysicsBehavior, { aboveWater: ref('isAboveWater') }],
    [AddDelta,        { varName: 'time', max: entity('lifeSpan'), eventName: 'removeDebris' }]
  ],

  initialize: function Debris() {
    this.set('time', 0);
    this.set('rotation', [0, 0, 0]);
    this.set('lifeSpan', Math.random() * 4 + 3);

    var pos = this.get('position');
    pos[1] -= 20;

    this.aboveWater = true;

    var launchNormal = terrain.getGroundNormal(pos[0], pos[2]);
    launchNormal.x += Math.random() - 0.5;
    launchNormal.y += Math.random() - 0.5;
    launchNormal.z += Math.random() - 0.5;
    launchNormal.normalize();
    launchNormal.normalize().multiplyScalar((1-this.get('randomSize')) * 350 + 100);
    this.set('velocity', launchNormal.toArray());

    var angularVelocity = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    angularVelocity.multiplyScalar((1.5-this.get('randomSize')) * 20);
    this.set('angularVelocity', angularVelocity.toArray());

    var self = this;
    this.on('tick', function(delta) {
      self.tick(delta);
    });

    this.on('removeDebris', function() {
      self.getWorld().remove(self);
    });
  },

  size: function() {
    var size = this.get('size');
    return this.get('randomSize') * (size[0] + size[1]);
  },

  life: function() {
    var lifeSpan = this.get('lifeSpan');
    var time = this.get('time');
    return lifeSpan - time;
  },

  isAboveWater: function() {
    return this.get('position')[1] > 40;
  },

  tick: function(delta) {
    if (this.aboveWater && !this.isAboveWater()) {
      this.getWorld().add(new Splash({
        position: this.get('position')
      }));

      this.aboveWater = false;
    }
  }
});

export default = Debris;
