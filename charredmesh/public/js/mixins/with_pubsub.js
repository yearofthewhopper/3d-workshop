var withPubSub = (function() {

  function getListeners() {
    this.listeners = this.listeners || mori.hash_map();
    return this.listeners;
  }

  function on(eventName, method) {
    this.listeners = mori.assoc_in(getListeners.call(this), [eventName, method], method);
  }

  function off(eventName, method) {
    var listeners = mori.get(getListeners.call(this), eventName);
    var eventListeners = mori.get(listeners, eventName);
    this.listeners = mori.assoc(listeners, eventName, mori.dissoc(eventListeners, method));
  }

  function trigger(eventName, data) {
    var listeners = mori.get(getListeners.call(this), eventName);
    var starListeners = mori.get(getListeners.call(this), '*');

    var self = this;
    mori.each(mori.vals(mori.concat(listeners, starListeners)), function(f) {
      f.call(self, data, eventName);
    });
  }

  function pipeSocketEvent(socket, eventName) {
    var self = this;
    socket.on(eventName, function(data){
      self.trigger(eventName, data);
    });
  }

  var withPubSub = function() {
    this.on = on;
    this.off = off;
    this.trigger = trigger;
    this.pipeSocketEvent = pipeSocketEvent;

    this.on('after:initialize', function() {
      this.trigger('initialize');
    })
  }

  return withPubSub;
}).call(this);
