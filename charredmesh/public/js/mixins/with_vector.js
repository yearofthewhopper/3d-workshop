var withVector = (function() {
  return function() {
    var names = Array.prototype.slice.call(arguments, 0);

    return function withVector() {

      for (var i = 0; i < names.length; i++) {
        (function(name) {
          var capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

          this['get' + capitalizedName + 'Vector'] = function() {
            this[name + 'Vector'] = this[name + 'Vector'] || new THREE.Vector3();
            return this[name + 'Vector'];
          };
        }).call(this, names[i]);
      }

      this.after('stateChange', function(key, value) {
        for (var i = 0; i < names.length; i++) {
          var name = names[i];
          var capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
          
          if (key === name) {
            this['get' + capitalizedName + 'Vector']();
            this[name + 'Vector'].fromArray(value);
          }
        }
      });
    };
  };

}).call(this);
