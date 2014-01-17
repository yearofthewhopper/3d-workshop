var withWorldReference = (function() {

  var withWorldReference = function() {
    this.didAdd = function(world) {
      this.world = world;
    };

    this.didRemove = function() {
      this.world = null;
    };
  }

  return withWorldReference;
}).call(this);
