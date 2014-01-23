import Entity from '../core/entity';
import Vector3Copy from '../behaviors/vector3_copy_behavior';
import ExplosionBehavior from '../behaviors/explosion_behavior';
import DebrisBehavior from '../behaviors/debris_behavior';
import ProjectilePhysicsBehavior from '../behaviors/projectile_physics_behavior';
import Player from '../entities/player';
import Actor from '../core/actor';
import { entity, ref } from '../core/game';

var explosionRadius = 450;

var Projectile = Entity.define({
  behaviors: [
    [Vector3Copy,        { keys: ['position'] }],
    [ProjectilePhysicsBehavior, { collisionEvent: 'explode' }], // Should be if authority or simulated
    [ExplosionBehavior,  { position: entity('position'), color: entity('color'), executeOn: 'explode' }, !global.isNode],
    [DebrisBehavior,     { position: entity('position'), executeOn: 'explode' }, !global.isNode]
  ],

  actor: {
    typeName:   'projectile',
    role:       global.isNode ? Actor.Role.AUTHORITY : Actor.Role.SIMULATED,
    remoteRole: global.isNode ? Actor.Role.SIMULATED : Actor.Role.AUTHORITY
  },

  initialize: function Projectile() {
    var self = this;

    this.on('explode', function() {
      self.onExplode();
    });
  },

  onExplode: function() {
    if (!global.isNode) {
      if (this.getWorld().get('currentPlayerId') === this.get('owner')) {
        this.getWorld().set('firingState', Player.FIRING_STATE.NONE);
      }
      return;
    }

    // this.projectileDamage();
    // this.makeCrater(explosionRadius / 1.5);

    this.getWorld().trigger('network.explosion', [{
      position: this.get('position'),
      color: this.get('color')
    }]);

    this.getWorld().remove(this);
  },

  makeCrater: function(radius) {
    var position = new THREE.Vector3().fromArray(this.get('position'));
    var samplePos = new THREE.Vector3();
    var changeCount = 0;
    
    var gridRadius = Math.round(terrain.worldToTerrain(radius));

    var dirtyChunks = {};

    var dx = Math.floor(terrain.worldToTerrain(position.x) - gridRadius);
    var dy = Math.floor(terrain.worldToTerrain(position.z) - gridRadius);
    var dw = Math.floor(terrain.worldToTerrain(radius*2));
    var dh = dw;

    if( (dx < 0) || ((dx+dw) >= terrain.terrainDataWidth) || (dy < 0) || ((dy+dh) >= terrain.terrainDataHeight)){
      return;
    }

    for(var y = -gridRadius; y < gridRadius+1; y++){
      var worldY = terrain.terrainToWorld(y);
      for(var x = -gridRadius; x < gridRadius+1; x++){

        var worldX = terrain.terrainToWorld(x);
        samplePos.set(worldX+position.x, terrain.getGroundHeight(worldX+position.x, worldY+position.z), worldY+position.z);
        
        var dst = position.distanceTo(samplePos);

        if(dst < radius) {
          if(dst > 0){
            var depth =  Math.cos( dst/radius * (Math.PI / 2));
            terrain.setGroundHeight(samplePos.x, samplePos.z, Math.max(0, samplePos.y - (depth * 50)));
          } 
        }
      }
    }

    var f = terrain.getDataRegion(dx,dy,dw,dh);
    terrain.updateNormals(f);
    // console.log(f);
    socketio.sockets.emit("terrainUpdate", f );
    //console.log("Terrain change: " + (w*h));
  },

  projectileDamage: function() {
    var collision = new THREE.Vector3().fromArray(this.get('position'));
    collision.y += playerHeight * 0.5;
    
    mapObject(function(player) {
      if(player.alive){
        var distance = player.position.distanceTo(collision);
        
        if (distance < explosionRadius) {
          player.health -= maxDamage * (1 - (distance / explosionRadius));
          player.health = Math.max(player.health, 0);
          
          if(player.health <= 0){
            if(player.id == projectile.owner) {
              gameState.players[projectile.owner].score -= 5;
            } else {
              gameState.players[projectile.owner].score++;
            }
          }
        }
      }
    }, gameState.players);
  }
});

export default = Projectile;
