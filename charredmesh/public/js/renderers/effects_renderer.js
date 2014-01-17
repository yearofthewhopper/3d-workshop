function EffectsRenderer(world) {
  this.constructor.call(this, world);
}
EffectsRenderer.inherits(Renderer);
EffectsRenderer.listensTo = ['before:render'];

EffectsRenderer.prototype.beforeRender = function(delta, renderer) {
  for (var e = 0; e < effectQueue.length; e++) {
    
    effectQueue[e].update(delta);
    
    if(effectQueue[e].isDone()) {
      effectQueue[e].remove();
      effectQueue.splice(e, 1);
      e--;
    }
  }
};
