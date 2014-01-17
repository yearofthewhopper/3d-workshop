function Renderer(world) {
  this.world = world;
}
Renderer.listensTo = [];

Renderer.prototype.createEntity = function(entity) {
  throw "Renderer#createEntity must be implemented by an inheriting class";
};
Renderer.prototype.renderEntity = function(entity, delta) {
  throw "Renderer#renderEntity must be implemented by an inheriting class";
};
Renderer.prototype.removeEntity = function(entity) {
  throw "Renderer#removeEntity must be implemented by an inheriting class";
};
Renderer.prototype.beforeRender = function(delta) {
  throw "Renderer#beforeRender must be implemented by an inheriting class";
};
Renderer.prototype.afterRender = function(delta) {
  throw "Renderer#afterRender must be implemented by an inheriting class";
};
Renderer.prototype.resize = function() {
  throw "Renderer#resize must be implemented by an inheriting class";
};
