var Game = {};

Game.inherits = function(childCtor, parentCtor) {
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};

function entity(varName) {
  return function() {
    return this.entity.get(varName);
  }
}

function ref(varName) {
  return function() {
    var target = this.entity[varName];

    if ('function' === typeof target) {
      return target.call(this.entity);
    } else {
      return this.entity[varName];
    }
  }
}

var wrapperIDs = 0;
var instanceIDs = 0;

Game.defineWrapper = function(baseClass, constructor, details) {
  var klass = function(params) {
    var args = Array.prototype.slice.call(arguments, 0);

    this.uid = instanceIDs++;

    // Base constructor
    this.constructor.superClass_.constructor.apply(this, args);

    // Child "initialize"
    constructor.apply(this, args);
  };

  Game.inherits(klass, baseClass);

  for (var key in details) {
    if (details.hasOwnProperty(key)) {
      klass.prototype[key] = details[key];
    }
  }

  klass.classTypeId = wrapperIDs++;

  return klass;
};

Game.defineClass = function(details) {
  var constructor = details.initialize || function() {};
  delete details.initialize;

  var wrappedConstructor = function(params) {
    constructor.apply(this, arguments);
  }

  var wrapped = Game.defineWrapper(Game.Object, wrappedConstructor, details);

  return wrapped;
};
