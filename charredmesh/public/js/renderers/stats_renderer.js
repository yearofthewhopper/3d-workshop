function StatsRenderer(world) {
  this.constructor.call(this, world);
}
StatsRenderer.inherits(Renderer);
StatsRenderer.listensTo = ['before:render'];

StatsRenderer.prototype.beforeRender = function(delta, renderer) {
  var stats = [];
  stats.push("calls: " + renderer.info.render.calls);
  stats.push("faces: " + renderer.info.render.faces);
  stats.push("vertices: " + renderer.info.render.vertices);
  stats.push("geometries: " + renderer.info.memory.geometries);
  stats.push("textures: " + renderer.info.memory.textures);
  stats.push("chunk updates: " + chunkUpdateCount);
  if(playerId){
    stats.push("Player Chunk ID: " + Math.floor((players[playerId].obj.position.x / terrain.worldUnitsPerDataPoint) / chunkSize) + "_" + + Math.floor((players[playerId].obj.position.z / terrain.worldUnitsPerDataPoint) / chunkSize));
  }

  mapObject(function(player){
    stats.push(player.name + ": " + player.score);
  }, players);

  $("#stats").html(stats.join("<br>"));
};
