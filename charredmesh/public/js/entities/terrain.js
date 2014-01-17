var Terrain = (function() {
  return GameObject.define(Terrain);

  function onTerrainUpdate(region) {
    terrain.setDataRegion(region);
    updateModifiedTerrainChunks(region);
    updateTerrainNormalMap();
  }

  function Terrain() {
    this.onTerrainUpdate = onTerrainUpdate;

    this.on('before:initialize', function() {
      this.params.id = 'singleton';
    });

    this.on('terrainUpdate', onTerrainUpdate);

    this.on('after:initialize', function() {
      $.ajax("/terrain-all", {
        success: function(data){
          terrainData = Util.decodeBase64(data);
          terrain.loadBase64Data(data);
          readyFlags.terrain = true;
          checkReadyState();

          updateTerrainNormalMap();
        }
      });
    })
  }
}).call(this);
