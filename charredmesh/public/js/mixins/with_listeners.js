var withListeners = (function() {

  function onName(eventName) {
    return 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
  }

  return function() {
    var listeners = mori.set(Array.prototype.slice.call(arguments, 0));

    return function withListeners() {
      this.after('initialize', function() {
        var self = this;

        var handlers = {};

        this.didAdd = function(world) {
          mori.each(listeners, function(eventName) {
            var name = onName(eventName);
            if (self[name]) {
              var handler = function() {
                self[name].apply(self, arguments);
              };
              world.on(eventName, handler);
              handlers[eventName] = handler;
            }
          });
        };

        this.didRemove = function(world) {
          for (var eventName in handlers) {
            if (handlers.hasOwnProperty(eventName)) {
              world.off(eventName, handlers[eventName]);
            }
          }
        };
      });
    };
  };
}).call(this);
