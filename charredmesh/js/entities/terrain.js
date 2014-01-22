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
  }
});

export default = Terrain;
