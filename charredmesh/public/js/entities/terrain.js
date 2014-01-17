var Terrain = (function() {
  return makeStatefulComponent(Terrain,
    withListeners('terrainUpdate'));

  function onTerrainUpdate(region) {
    terrain.setDataRegion(region);
    updateModifiedTerrainChunks(region);
    updateTerrainNormalMap();
  }

  function Terrain() {
    this.onTerrainUpdate = onTerrainUpdate;

    this.before('initialize', function(terrainData) {
      terrainData.id = 'singleton';
    });

    this.after('initialize', function() {
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
