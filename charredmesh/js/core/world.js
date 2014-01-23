import { defineClass } from './game';
import Entity from './entity';
import Explosion from '../entities/explosion';
import EventManager from './event_manager';
import StateManager from './state_manager';
import { proxyMethodsTo } from '../utils';

var World = defineClass(Entity, {
  initialize: function(params) {
    this.entities = {};

    this.eventManager = new EventManager(this);
    proxyMethodsTo.call(this, ['on', 'off'], this.eventManager);

    this.stateManager = new StateManager(this);
    proxyMethodsTo.call(this, ['get', 'set', 'sync'], this.stateManager);

    this.sync(params);
  },

  mapEntities: function(iterator) {
    for (var key in this.entities) {
      if (this.entities.hasOwnProperty(key)) {
        var e = this.entities[key];
        return iterator(e);
      }
    }
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
    this.forwardTriggerToEntities(eventName, data);
  },

  forwardTriggerToEntities: function(eventName, data) {
    if (['addToWorld', 'removeFromWorld'].indexOf(eventName) > -1) {
      return;
    }

    this.eventManager.trigger('worldEvent', [{ eventName: eventName, data: data ? data[0] : null }]);

    for (var key in this.entities) {
      if (this.entities.hasOwnProperty(key)) {
        var e = this.entities[key];
        e.trigger(eventName, data);
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

export default = World;
