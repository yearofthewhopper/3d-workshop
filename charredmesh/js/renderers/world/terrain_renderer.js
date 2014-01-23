import TerrainLib from 'terrain';

// window.terrainData = null;
window.chunkSize = 64;

var terrainMaterial = null;
window.terrainNormalMap = null;
window.terrainHeightMap = null;
window.terrain = new TerrainLib();

window.layerTextures = [];
window.chunkUpdateCount = 0;

window.terrainChunks = {
};

function TerrainRenderer(world) {
  this.world = world;

  layerTextures[0] = THREE.ImageUtils.loadTexture("textures/terrain/tile_rock.png");
  layerTextures[1] = THREE.ImageUtils.loadTexture("textures/terrain/tile_dirt.png");
  layerTextures[2] = THREE.ImageUtils.loadTexture("textures/terrain/tile_grass.png");
  layerTextures[3] = THREE.ImageUtils.loadTexture("textures/terrain/tile_sand.png");
  layerTextures[4] = THREE.ImageUtils.loadTexture("textures/terrain/tile_cliff.png");

  for(var i = 0; i < layerTextures.length; i++){
    layerTextures[i].wrapS = layerTextures[i].wrapT = THREE.RepeatWrapping;
  }

  terrainNormalMap = THREE.ImageUtils.generateDataTexture(1024, 1024, new THREE.Color( 0x888888 )  );
  terrainNormalMap.flipY = false;
  terrainNormalMap.needsUpdate = true;

  terrainHeightMap = THREE.ImageUtils.generateDataTexture(1024, 1024, new THREE.Color( 0x000000 )  );
  terrainHeightMap.flipY = false;
  terrainHeightMap.needsUpdate = true;

  terrainMaterial = new THREE.ShaderMaterial({
    uniforms : {
      fogColor:    { type: "c", value: scene.fog.color },
      fogNear:     { type: "f", value: scene.fog.near },
      fogFar:      { type: "f", value: scene.fog.far },

      normalmap : { type: "t", value: terrainNormalMap },
      uvOffset : { type: "v2", value: new THREE.Vector2() },
      heightmap : { type: "t", value: terrainHeightMap },
      
      tex0: { type: "t", value: layerTextures[3] },
      tex1: { type: "t", value: layerTextures[2] },
      tex2: { type: "t", value: layerTextures[1] },
      tex3: { type: "t", value: layerTextures[0] },
      
      cliffTexture: { type: "t", value: layerTextures[4] },
      lightDirection : { type: "v3", value : sunPosition },
      
      skyColor: { type: "t", value: THREE.ImageUtils.loadTexture("textures/sky.png") }
    },
    vertexShader: loadShaderSource('vertex-terrain'),
    fragmentShader: loadShaderSource('fragment-terrain'),
    //wireframe:true
    fog:true
  });  
};
TerrainRenderer.prototype.render = function() {};

var updateModifiedTerrainChunks = window.updateModifiedTerrainChunks = function updateModifiedTerrainChunks(region){
  var id = Math.floor(region.x / chunkSize) + "_" + Math.floor(region.y / chunkSize);
  if(terrainChunks.hasOwnProperty(id)){
    terrainChunks[id].lod = -1; // mark for deletion.
  }
  id = Math.floor((region.x+region.w) / chunkSize) + "_" +  Math.floor(region.y / chunkSize);
  if(terrainChunks.hasOwnProperty(id)){
    terrainChunks[id].lod = -1; // mark for deletion.
  }
  id = Math.floor((region.x+region.w) / chunkSize) + "_" + Math.floor((region.y+region.w) / chunkSize);
  if(terrainChunks.hasOwnProperty(id)){
    terrainChunks[id].lod = -1; // mark for deletion.
  }
  id = Math.floor(region.x / chunkSize) + "_" + Math.floor((region.y+region.h) / chunkSize);
  if(terrainChunks.hasOwnProperty(id)){
    terrainChunks[id].lod = -1; // mark for deletion.
  }
}

var updateTerrainChunks = window.updateTerrainChunks = function updateTerrainChunks(world){
  var currentPlayerId = world.get('currentPlayerId');

  var terrainResolution = terrain.worldUnitsPerDataPoint;

  var viewDistanceHQ = 1000;
  var viewDistanceMQ = 6000;
  var viewDistance = 24000;

  var playerX = players[currentPlayerId].obj.position.x;
  var playerZ = players[currentPlayerId].obj.position.z;

  var startX = Math.floor(((playerX - viewDistance) / terrainResolution) / chunkSize);
  var startZ = Math.floor(((playerZ - viewDistance) / terrainResolution) / chunkSize);

  var endX = Math.floor(((playerX + viewDistance) / terrainResolution) / chunkSize)+1;
  var endZ = Math.floor(((playerZ + viewDistance) / terrainResolution) / chunkSize)+1;

  startX = Math.max(0, startX);
  startZ = Math.max(0, startZ);

  endX = Math.min(1024 / chunkSize, endX);
  endZ = Math.min(1024 / chunkSize, endZ);

  var player = new THREE.Vector2(playerX, playerZ);
  var tile = new THREE.Vector2();

  var mapToWorld = chunkSize * terrainResolution;
  var halfTile = mapToWorld / 2;

  for(var x = startX; x < endX; x++){
    for(var z = startZ; z < endZ; z++){
      
      tile.set(x*mapToWorld+halfTile, z*mapToWorld+halfTile);
      
      var dist = tile.distanceTo(player);

      if(dist < viewDistance){

        if(dist < viewDistanceHQ){
          addTerrainChunk(x, z, 1);
        }else if(dist < viewDistanceMQ){
          addTerrainChunk(x, z, 2);  
        }else {
          addTerrainChunk(x, z, 8);
        }
      }
      
    }
  }

  for(var key in terrainChunks){
    tile.set(terrainChunks[key].obj.position.x+halfTile, terrainChunks[key].obj.position.z+halfTile);
    if(tile.distanceTo(player) > viewDistance+250) {
      removeTerrainChunk(key);
    }
  }
}

var updateTerrainNormalMap = window.updateTerrainNormalMap = function updateTerrainNormalMap(){

  var count = 1024 * 1024 * 3;

  for(var i = 0; i < count; i += 3){
    terrainNormalMap.image.data[i] = terrain.terrainNormals[i];
    terrainNormalMap.image.data[i+1] = terrain.terrainNormals[i+1];
    terrainNormalMap.image.data[i+2] = terrain.terrainNormals[i+2];
  }

  terrainNormalMap.needsUpdate = true;

  count = 1024 * 1024 * 3;
  for(var i = 0; i < count; i++){
    terrainHeightMap.image.data[i] = terrain.terrainHeight[i];
  }
  terrainHeightMap.needsUpdate = true;
}

function removeTerrainChunk(chunkId){
  if(terrainChunks.hasOwnProperty(chunkId)){
    terrainChunks[chunkId].obj.geometry.dispose();
    scene.remove(terrainChunks[chunkId].obj);
    delete terrainChunks[chunkId];
  }
}

function addTerrainChunk(tx, ty, quality){
  
  // TODO: refactor this.
  if((tx > 31) || (tx < 0) || (ty > 31) || (ty < 0)){
    return;
  }

  var chunkId = tx+"_"+ty;
  if(!terrainChunks.hasOwnProperty(chunkId) || (terrainChunks[chunkId].lod != quality)) {
    if(terrainChunks.hasOwnProperty(chunkId) && (terrainChunks[chunkId].lod != quality)){
      removeTerrainChunk(chunkId);
    }
    chunkUpdateCount++;
    var data = [];
    
    var xOffset = tx*chunkSize;
    var yOffset = ty*chunkSize;
    
    var max = 1023;
    var dataX = 0;
    var dataY = 0;

    for(var y = 0; y < chunkSize+1; y++){
      dataY = yOffset+y;
      for(var x = 0; x < chunkSize+1; x++){
        dataX = xOffset+x;

        if(dataX > max){
          dataX = max;
        } else if(dataX < 0){
          dataX = 0;
        }
        if(dataY > max){
          dataY = max;
        }else if (dataY < 0){
          dataY = 0;
        }
        try{
          data.push( terrain.getTerrainPoint(dataX, dataY) );
          //data.push( terrainData.getUint8( (dataX) + (dataY) * 1024 )); 
        } catch(e){
          //console.log("ERROR for coordinate: " + (dataX) + ", " + (dataY));
          return;
        }
      }
    }

    var color = 0xff0000;
    switch(quality){
      case 1:
        color = 0xff0000;
        break;
      case 2:
        color = 0x00ff00;
        break;
      case 8:
        color = 0x0000ff;
        break;
      default:
        color = 0xffffff;
        break;
    }
    
    var chunkGeometry = new THREE.TerrainGeometry(quality, chunkSize, terrain.worldUnitsPerDataPoint, data);
    //var chunkMesh = new THREE.Mesh(chunkGeometry, new THREE.MeshLambertMaterial({color:color, fog:false, emissive:color, wireframe:true}));
    var chunkMesh = new THREE.Mesh(chunkGeometry, terrainMaterial);
    chunkMesh.name = "chunk_" + chunkId;
    chunkMesh.position.set(terrain.terrainToWorld(tx * chunkSize), 0, terrain.terrainToWorld(ty * chunkSize));
    
    scene.add(chunkMesh);

    terrainChunks[chunkId] = {
      lod : quality,
      obj : chunkMesh
    };
  }
}

export default = TerrainRenderer;
