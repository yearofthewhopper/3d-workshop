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
    var self = this;
    mori.each(mori.vals(listeners), function(f) {
      f.call(self, data);
    });
  }

  function pipeSocketEvent(socket, eventName) {
    var self = this;
    socket.on(eventName, function(data){
      self.trigger(eventName, data);
    });
  }

  function withPubSub() {
    this.on = on;
    this.off = off;
    this.trigger = trigger;
    this.pipeSocketEvent = pipeSocketEvent;
  }

  return withPubSub;
}).call(this);
