var NetworkServer = function(world) {
  this.world = world;
  this.connections = {};
  this.pendingOperations = [];

  var self = this;
  this.world.on('addToWorld', function(e) {
    self.addOperation('create', e.actor.typeName, e.getRawState());
  });

  this.world.on('removeFromWorld', function(e) {
    self.addOperation('remove', e.actor.typeName, { id: e.get('id') });
  });

  this.world.on('worldEvent', function(e) {
    if (e.eventName.match(/^network\./)) {
      self.addOperation('event', e.eventName.replace(/^network\./, ''), e.data);
    }
  });
};

NetworkServer.prototype.addConnection = function(socket) {
  this.connections[socket.id] = socket;
  // Do stuff?
};

NetworkServer.prototype.removeConnection = function(socket) {
  delete this.connections[socket.id];
  // Do stuff?
};

NetworkServer.prototype.sync = function() {
  var self = this;
  this.world.mapEntities(function(e) {
    if (e.actor.isDirty) {
      self.addOperation('update', e.actor.typeName, e.getRawState());
    }
  });

  for (var i = 0; i < this.pendingOperations.length; i++) {
    this.broadcast('actor:operation', this.pendingOperations[i]);
  }

  this.pendingOperations.length = 0;

  this.world.mapEntities(function(e) {
    if (e.actor.isDirty) {
      e.actor.becameClean();
    }
  });
};

NetworkServer.prototype.broadcast = function(eventName, params) {
  console.log('broadcast', eventName, params);
  for (var id in this.connections) {
    if (this.connections.hasOwnProperty(id)) {
      this.connections[id].emit(eventName, params);
    }
  }
};

NetworkServer.prototype.makeOperation = function(op, type, params) {
  return { op: op, type: type, params: params };
};

NetworkServer.prototype.addOperation = function(op, type, params) {
  this.pendingOperations.push(this.makeOperation.apply(this, arguments));
};

export default = NetworkServer;
