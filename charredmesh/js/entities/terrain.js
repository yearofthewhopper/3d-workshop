import Entity from 'core/entity';
import { Util } from 'utils';

var Terrain = Entity.define({
  initialize: function Terrain() {
    $.ajax("/terrain-all", {
      success: function(data){
        terrainData = Util.decodeBase64(data);
        terrain.loadBase64Data(data);
        readyFlags.terrain = true;
        checkReadyState();

        updateTerrainNormalMap();
      }
    });

    this.on('terrainUpdate', function(region) {
      terrain.setDataRegion(region);
      updateModifiedTerrainChunks(region);
      updateTerrainNormalMap();
    });

    // this.on('explosion', function() {
    //   self.makeCrater(300);
    // });
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
  }
});

export default = Terrain;
