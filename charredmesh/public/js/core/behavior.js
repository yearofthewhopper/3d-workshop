Game.Behavior = function(entity, options) {
  this.entity = entity;
  this.options_ = options;
  this.enabled_ = true;

  proxyMethodsTo.call(this, ['on', 'off', 'trigger', 'getWorld', 'get', 'set'], this.entity);
};

Game.Behavior.prototype.isActive = function() {
  return this.enabled_;
};

Game.Behavior.prototype.enable = function() {
  this.enabled_ = true;
  this.initialize();
};

Game.Behavior.prototype.disable = function() {
  this.enabled_ = false;
  this.destroy();
};

Game.Behavior.prototype.onMessage = function(eventName, data) {
};

Game.Behavior.prototype.getOption = function(name) {
  var ref = this.options_[name];

  if ('function' === typeof ref) {
    return ref.call(this);
  } else {
    return ref;
  }
};

Game.Behavior.prototype.destroy = function() {

};

Game.Behavior.define = function(details) {
  var constructor = details.initialize || function() {};
  // delete details.initialize;

  return Game.defineWrapper(Game.Behavior, constructor, details);
};
