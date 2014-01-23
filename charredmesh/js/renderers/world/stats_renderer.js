function StatsRender(world) {
  this.world = world;
};

StatsRender.prototype.render = function() {
  var stats = [];
  stats.push("calls: " + renderer.info.render.calls);
  stats.push("faces: " + renderer.info.render.faces);
  stats.push("vertices: " + renderer.info.render.vertices);
  stats.push("geometries: " + renderer.info.memory.geometries);
  stats.push("textures: " + renderer.info.memory.textures);
  stats.push("chunk updates: " + chunkUpdateCount);

  var currentPlayerId = this.world.get('currentPlayerId');
  if (currentPlayerId) {
    stats.push("Player Chunk ID: " + Math.floor((players[currentPlayerId].obj.position.x / terrain.worldUnitsPerDataPoint) / chunkSize) + "_" + + Math.floor((players[currentPlayerId].obj.position.z / terrain.worldUnitsPerDataPoint) / chunkSize));
  }

  mapObject(function(player){
    stats.push(player.name + ": " + player.score);
  }, players);

  $("#stats").html(stats.join("<br>"));
};

export default = StatsRender;
