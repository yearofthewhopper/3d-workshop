Game.Object = function(params) {
  this.behaviorManager = new Game.BehaviorManager(this);
  proxyMethodsTo.call(this, ['addBehavior', 'addBehaviors'], this.behaviorManager);

  this.eventManager = new Game.EventManager(this);
  proxyMethodsTo.call(this, ['on', 'off'], this.eventManager);

  this.stateManager = new Game.StateManager(this);
  proxyMethodsTo.call(this, ['get', 'set', 'sync'], this.stateManager);

  var self = this;
  this.on('didAddToWorld', function(world) {
    self.world_ = world;
    self.behaviorManager.setup();
  });

  this.on('didRemoveFromWorld', function() {
    self.behaviorManager.destroy();
    self.world_ = null;
  });
};

Game.Object.prototype.trigger = function() {
  this.eventManager.trigger.apply(this.eventManager, arguments);
  this.behaviorManager.trigger.apply(this.behaviorManager, arguments);  
};

Game.Object.prototype.getWorld = function() {
  return this.world_;
};

Game.Object.prototype.guid = function() {
  return 'type' + this.constructor.classTypeId + '_instance' + this.get('id');
};

Game.Object.prototype.destroy = function() {

};

Game.Object.define = function(details) {
  var constructor = details.initialize || function() {};
  delete details.initialize;

  var behaviors = details.behaviors || [];
  delete details.behaviors;

  var wrappedConstructor = function(params) {
    params = params || {};
    params.id = params.id || this.uid;
    this.sync(params);
    this.addBehaviors(behaviors);

    this.trigger('willInitialize');
    constructor.apply(this, arguments);
    this.trigger('didInitialize');
  }

  var wrapped = Game.defineWrapper(Game.Object, wrappedConstructor, details);

  return wrapped;
};
