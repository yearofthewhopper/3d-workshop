var Vector3Copy = Game.Behavior.define({
  initialize: function Vector3Copy() {
    this.setupProxyMethods(this.getOption('keys'));
  },

  setupProxyMethods: function(keys) {
    _.each(keys, this.setupProxyMethod, this);
  },

  setupProxyMethod: function(key) {
    this[key + 'Vector_'] = new THREE.Vector3();

    var methodName = 'get' + capitalize(key) + 'Vector';
    this[methodName] = function() {
      return this[key + 'Vector_'];
    };

    proxyMethodsTo.call(this.entity, [methodName], this);
  },

  updateProxyMethod: function(key, value) {
    if (this[key + 'Vector_']) {
      this[key + 'Vector_'].fromArray(value);
    }
  },

  onMessage: function(eventName, data) {
    if (eventName === 'stateChange') {
      this.updateProxyMethod(data.key, data.value);
    }
  }
});
