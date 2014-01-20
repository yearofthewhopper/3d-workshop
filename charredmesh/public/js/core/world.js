var World = Game.defineClass({
  initialize: function(params) {
    this.entities = {};

    this.eventManager = new Game.EventManager(this);
    proxyMethodsTo.call(this, ['on', 'off'], this.eventManager);

    this.stateManager = new Game.StateManager(this);
    proxyMethodsTo.call(this, ['get', 'set', 'sync'], this.stateManager);

    this.sync(params);
  },

  getEntity: function(type, id) {
    if (typeof type === 'string') {
      return this.entities[type + '_' + id];
    } else {
      return this.entities['type' + type.classTypeId + '_instance' + id];
    }
  },

  add: function(entity) {
    this.entities[entity.guid()] = entity;
    entity.trigger('didAddToWorld', [this]);
    this.trigger('addToWorld', [entity]);
  },

  remove: function(entity) {
    delete this.entities[entity.guid()];
    entity.trigger('didRemoveFromWorld');    
    this.trigger('removeFromWorld', [entity]);
  },

  syncEntity: function(type, entityData) {
    var entity = this.getEntity(type, entityData.id);
    entity.sync(entityData)
  },

  tick: function(delta) {
    this.trigger('tick', [delta]);
  },

  trigger: function(eventName, data) {
    this.eventManager.trigger.apply(this.eventManager, arguments);
    this.forwardTriggerToEntities.apply(this, arguments);
  },

  forwardTriggerToEntities: function(eventName) {
    if (['addToWorld', 'removeFromWorld'].indexOf(eventName) > -1) {
      return;
    }
    
    for (var key in this.entities) {
      if (this.entities.hasOwnProperty(key)) {
        var e = this.entities[key];
        e.trigger.apply(e, arguments);
      }
    }
  },

  pipeSocketEvent: function(socket, eventName) {
    var self = this;
    socket.on(eventName, function() {
      self.trigger(eventName, arguments);
    });
  }

});
