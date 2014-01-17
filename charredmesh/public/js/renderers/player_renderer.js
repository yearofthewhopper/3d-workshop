function PlayerRenderer(world) {
  this.playerVisibility = {};

  this.constructor.call(this, world);

  this.prepare();
}
PlayerRenderer.inherits(Renderer);
PlayerRenderer.listensTo = ['entity:player'];

PlayerRenderer.prototype.prepare = function() {

};

PlayerRenderer.prototype.createEntity = function(player) {
  this.playerVisibility[player.get('id')] = player.get('visible');
};

PlayerRenderer.prototype.renderEntity = function(player) {
  var id = player.get('id');
  var nowVisible = player.get('visible');

  if (this.playerVisibility[id] !== nowVisible) {
    players[id].obj.traverse( function(child){
      child.visible = nowVisible;
    });

    if(playerId != id){
      players[id].overlay.obj.visible = nowVisible;
    }

    this.playerVisibility[id] = nowVisible;
  }
};

PlayerRenderer.prototype.removeEntity = function(player) {
  delete this.playerVisibility[player.get('id')];
};
