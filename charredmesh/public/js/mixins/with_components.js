var withComponents = (function() {
  function activeComponents(components) {
    var activeList = [];

    for (var key in components) {
      if (components.hasOwnProperty(key)) {
        var component = components[key];

        if (component.isActive()) {
          activeList.push(component);
        }
      }
    }

    return activeList;
  }

  function onActiveComponents(components, method, args) {
    var active = activeComponents(components);

    for (var i = 0; i < active.length; i++) {
      active[i][method].apply(active[i], args);
    }
  }

  function checkGuards(components, entity) {
    for (var key in this.componentsGuards) {
      if (this.componentsGuards.hasOwnProperty(key)) {
        var component = this.components[key];
        var componentGuard = this.componentsGuards[key];
        var guardResult = componentGuard.call(entity);

        if (component.isActive() && !guardResult) {
          component.disable();
        } else if (!component.isActive() && guardResult) {
          component.enable();
        }
      }
    }
  }

  function updateComponents() {
    checkGuards(this.components, this);
    onActiveComponents(this.components, 'update', arguments);
  }

  function messageComponents(eventName, eventData) {
    onActiveComponents(this.components, 'message', arguments);
  }

  function renderComponents(delta) {
    onActiveComponents(this.components, 'render', arguments);
  }

  function addComponent(component, guard) {
    var inst = new component({}, this);
    var id = inst.params.id;

    this.components[id] = inst;

    if (guard) {
      this.componentsGuards[id] = guard;
    }
  }

  return function() {
    var components = Array.prototype.slice.call(arguments, 0);

    return function withComponents() {
      this.updateComponents = updateComponents;
      this.messageComponents = messageComponents;
      this.renderComponents = renderComponents;

      this.addComponent = addComponent;

      this.on('before:initialize', function() {
        this.components = {};
        this.componentsGuards = {};

        for (var i = 0; i < components.length; i++) {
          this.addComponent(components[i]);
        }
      });

      this.on('after:initialize', function() {
        this.updateComponents();
      });

      this.on('*', function() {
        var args = Array.prototype.slice.call(arguments, 0);
        this.messageComponents.apply(this, args.reverse());
      });
    }
  }
}).call(this);

var withComponent = (function() {
  function onName(eventName) {
    return 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
  }

  function isActive() {
    return this.enabled;
  }

  function enable() {
    this.enabled = true;
  }

  function disable() {
    this.enabled = false;
  }

  var withComponent = function() {
    this.isActive = isActive;
    this.enable = enable;
    this.disable = disable;
    this.update = function() {
      if (this.onUpdate) {
        this.onUpdate.apply(this, arguments);
      }
    };
    this.render = function() {
      if (this.onRender) {
        this.onRender.apply(this, arguments);
      }
    };
    this.message = function(eventName) {
      if (this.onMessage) {
        this.onMessage.apply(this, arguments);
      }

      if (this[onName(eventName)]) {
        var args = Array.prototype.slice.call(arguments, 0);
        args.shift();
        this[onName(eventName)].apply(this, args);
      }
    };

    this.on('before:initialize', function(entity) {
      this.entity = entity;
      this.enabled = true;
    });
  }

  return withComponent;
}).call(this);
