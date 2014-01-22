import Behavior from '../../core/behavior';

var PlayerRenderer = Behavior.define({
  initialize: function PlayerRenderer() {
    this.changeVisibility(true);
  },

  changeVisibility: function(nowVisible) {
    var id = this.get('id');

    if (players[id]) {
      players[id].obj.traverse(function(child){
        child.visible = nowVisible;
      });

      if (playerId != id) {
        players[id].overlay.obj.visible = nowVisible;
      }
    }
  },

  destroy: function() {
    this.changeVisibility(false);
  }
});

export default = PlayerRenderer;
