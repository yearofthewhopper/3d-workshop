var World = (function() {
  return makeGameObject(World);

  function getSingleton(type) {
    return this.getEntity(type, 'singleton');
  }

  function guid(entity) {
    if (entity.guid) {
      return entity.guid();
    }

    return entity.klass.type + '_' + entity.get('id');
  }

  function getEntity(type, id) {
    return this.entities[type + '_' + id];
  }

  function add(entity) {
    this.entities[guid(entity)] = entity;

    if (entity.didAdd) {
      entity.didAdd(this);
    }

    this.trigger('add', entity);
  }

  function remove(entity) {
    delete this.entities[guid(entity)];

    if (entity.didRemove) {
      entity.didRemove(this);
    }
    
    this.trigger('removeFromWorld', entity);
  }

  function removeByTypeId(type, id) {
    this.remove(this.getEntity(type, id));
  }

  function syncEntity(type, entityData) {
    var entity = this.getEntity(type, entityData.id || 'singleton');
    entity.sync(entityData)
  }

  function tick(delta) {
    this.trigger('tick', delta);
  }

  function forwardTriggerToEntities(data, eventName) {
    for (var key in this.entities) {
      if (this.entities.hasOwnProperty(key)) {
        var e = this.entities[key];
        e.trigger(eventName, data);
      }
    }
  }

  function initialize() {
    this.entities = {};
  }

  function World() {
    this.getSingleton = getSingleton;
    this.getEntity = getEntity;
    this.add = add;
    this.remove = remove;
    this.removeByTypeId = removeByTypeId;
    this.syncEntity = syncEntity;
    this.tick = tick;
    this.initialize = initialize;;

    this.on('*', forwardTriggerToEntities);
  }
}).call(this);
