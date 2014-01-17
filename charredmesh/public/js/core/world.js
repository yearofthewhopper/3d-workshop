var World = (function() {
  return makeStatefulComponent(World, withPubSub);

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

  // function trigger(eventName, data) {
  //   for (var id in this.entities) {
  //     if (this.entities.hasOwnProperty(id)) {
  //       var e = this.entities[id];

  //       if (e.getListeners && (e.getListeners().indexOf(eventName) > -1)) {
  //         e.trigger(eventName, data);
  //       }
  //     }
  //   }
  // }

  function remove(entity) {
    delete this.entities[guid(entity)];

    if (entity.didRemove) {
      entity.didRemove(this);
    }
    
    this.trigger('remove', entity);

  }

  function removeByTypeId(type, id) {
    this.remove(this.getEntity(type, id));
  }

  function syncEntity(type, entityData) {
    var entity = this.getEntity(type, entityData.id || 'singleton');
    entity.sync(entityData)
  }

  function tick(delta) {
    for (var key in this.entities) {
      if (this.entities.hasOwnProperty(key)) {
        var e = this.entities[key];
        e.tick(delta);
      }
    }
  }

  function resize() {
    var renderers = renderersForType.call(this, 'resize');

    for (var i = 0; i < renderers.length; i++) {
      var renderer = renderers[i];
      renderer.resize(this);
    }
  }

  function World() {
    this.getSingleton = getSingleton;
    this.getEntity = getEntity;
    this.add = add;
    this.remove = remove;
    this.removeByTypeId = removeByTypeId;
    this.syncEntity = syncEntity;
    this.tick = tick;

    this.before('initialize', function() {
      this.entities = {};
    });
  }
}).call(this);
