var WorldRenderer = (function() {
  return makeComponent(WorldRenderer);

  function registerRenderer() {
    for (var i = 0; i < arguments.length; i++) {
      registerRendererInternal.call(this, arguments[i]);
    }
  };

  function registerRendererInternal(handlerConstructor) {
    var handleTypes = handlerConstructor.listensTo || [];
    var handler = new handlerConstructor();

    for (var i = 0; i < handleTypes.length; i++) {
      var typeName = handleTypes[i];

      if (!this.renderers[typeName]) {
        this.renderers[typeName] = [];
      }

      this.renderers[typeName].push(handler);
    }
  };

  function renderersForType(type) {
    if (!this.rendererLookupCache[type]) {
      var allRenderers = mori.set(this.renderers['entity:all'] || []);
      var typeRenderers = mori.set(this.renderers[type] || []);
      this.rendererLookupCache[type] = mori.into_array(mori.union(allRenderers, typeRenderers));
    }

    return this.rendererLookupCache[type];
  };

  function setupEntity(e) {
    var renderers = renderersForType.call(this, 'entity:' + e.klass.type);

    for (var i = 0; i < renderers.length; i++) {
      var renderer = renderers[i];
      renderer.createEntity(e);
    }
  };

  function render(delta, threeRenderer, action) {
    for (var key in this.world.entities) {
      if (this.world.entities.hasOwnProperty(key)) {
        var e = this.world.entities[key];
        var renderers = renderersForType.call(this, 'entity:' + e.klass.type);

        for (var i = 0; i < renderers.length; i++) {
          var renderer = renderers[i];
          renderer.renderEntity(e, delta);
        }
      }
    }

    var renderers = renderersForType.call(this, 'before:render');

    for (var i = 0; i < renderers.length; i++) {
      var renderer = renderers[i];
      renderer.beforeRender(delta, threeRenderer);
    }

    action(this, delta, threeRenderer);

    var renderers = renderersForType.call(this, 'after:render');

    for (var i = 0; i < renderers.length; i++) {
      var renderer = renderers[i];
      renderer.afterRender(delta, threeRenderer);
    }
  };

  function removeEntity(e) {
    var renderers = renderersForType.call(this, 'entity:' + e.klass.type);

    for (var i = 0; i < renderers.length; i++) {
      var renderer = renderers[i];
      renderer.removeEntity(e);
    }
  };

  function resize() {
    var renderers = renderersForType.call(this, 'resize');

    for (var i = 0; i < renderers.length; i++) {
      var renderer = renderers[i];
      renderer.resize(this);
    }
  };

  function WorldRenderer() {
    this.registerRenderer = registerRenderer;
    this.render = render;
    this.resize = resize;

    this.initialize = function(world) {
      this.world = world;
      this.renderers = {};
      this.rendererLookupCache = {};

      var self = this;
      world.on('add', function(entity) {
        setupEntity.call(self, entity);
      });

      world.on('remove', function(entity) {
        removeEntity.call(self, entity);
      });
    };
  }
}).call(this);
