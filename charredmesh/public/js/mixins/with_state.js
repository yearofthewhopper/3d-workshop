var withState = (function() {

  var pathsToVectors = {};

  function pathToVector(path) {
    if (!pathsToVectors[path]) {
      pathsToVectors[path] = path.split('.');
    }

    return pathsToVectors[path];
  }

  function getStateHash(obj) {
    obj.state = obj.state || mori.hash_map();
    return obj.state;
  }

  function getRaw(key) {
    var state = getStateHash(this);
    return mori.get_in(state, pathToVector(key));
  }

  function get(key) {
    var state = getStateHash(this);
    return mori.clj_to_js(getRaw.call(this, key));
  }

  function set(key, value) {
    var currentValue = getRaw.call(this, key);
    var newValue = mori.js_to_clj(value);

    if (!mori.equals(currentValue, newValue)) {
      var state = getStateHash(this);
      this.state = mori.assoc_in(state, pathToVector(key), newValue);
      this.trigger('stateChange', { key: key, value: value });
    }

    return this;
  }

  function stateChange(key, value) {

  }

  function sync(data) {
    var dataMap = mori.js_to_clj(data);

    var self = this;
    mori.each(mori.keys(dataMap), function(key) {
      self.set(key, mori.clj_to_js(mori.get(dataMap, key)));
    })
  }

  function guid() {
    return this.klassName + '_' + this.get('id');
  }

  var withState = function() {
    this.guid = guid;
    this.get = get;
    this.set = set;
    this.stateChange = stateChange;
    this.sync = sync;

    this.on('after:initialize', function() {
      this.sync(this.params);
    });
  }

  return withState;
}).call(this);
