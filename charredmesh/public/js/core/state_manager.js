Game.StateManager = function(entity) {
  this.entity = entity;
  this.state_ = {};

  proxyMethodsTo.call(this, ['trigger'], this.entity);
};

Game.StateManager.prototype.get = function(key) {
  return this.state_[key];
};

Game.StateManager.prototype.set = function(key, value) {
  if (!_.isEqual(this.get(key), value)) {
    this.state_[key] = value;
    this.trigger('stateChange', [{ key: key, value: value }]);
  }
};

Game.StateManager.prototype.sync = function(data) {
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      this.set(key, data[key]);
    }
  }
};
