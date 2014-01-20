Game.EventManager = function() {
  this.emitter = new EventEmitter();
};
Game.EventManager.prototype.on = function() {
  return this.emitter.addListener.apply(this.emitter, arguments);
};
Game.EventManager.prototype.off = function() {
  return this.emitter.removeListener.apply(this.emitter, arguments);
};
Game.EventManager.prototype.trigger = function() {
  return this.emitter.emitEvent.apply(this.emitter, arguments);
};
