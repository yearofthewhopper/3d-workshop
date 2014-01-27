function inherits(childCtor, parentCtor) {
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};

function property(varName) {
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

function defineWrapper(baseClass, constructor, details) {
  var klass = function(params) {
    var args = Array.prototype.slice.call(arguments, 0);

    this.uid = instanceIDs++;

    // Base constructor
    this.constructor.superClass_.constructor.apply(this, args);

    // Child "initialize"
    constructor.apply(this, args);
  };

  inherits(klass, baseClass);

  for (var key in details) {
    if (details.hasOwnProperty(key)) {
      klass.prototype[key] = details[key];
    }
  }

  klass.classTypeId = wrapperIDs++;

  return klass;
};

function defineClass(base, details) {
  var constructor = details.initialize || function() {};
  delete details.initialize;

  var wrappedConstructor = function(params) {
    constructor.apply(this, arguments);
  }

  var wrapped = defineWrapper(base, wrappedConstructor, details);

  return wrapped;
};

export { inherits, property, ref, defineWrapper, defineClass };
