import { defineWrapper } from './game';
import { proxyMethodsTo } from '../utils';

var Behavior = function(entity, options) {
  this.entity = entity;
  this.options_ = options;
  this.enabled_ = true;

  proxyMethodsTo.call(this, ['on', 'off', 'trigger', 'getWorld', 'get', 'set', 'getRawState'], this.entity);
};

Behavior.prototype.isActive = function() {
  return this.enabled_;
};

Behavior.prototype.enable = function() {
  this.enabled_ = true;
  this.initialize();
};

Behavior.prototype.disable = function() {
  this.enabled_ = false;
  this.destroy();
};

Behavior.prototype.onMessage = function(eventName, data) {
};

Behavior.prototype.getOption = function(name) {
  var ref = this.options_[name];

  if ('function' === typeof ref) {
    return ref.call(this);
  } else {
    return ref;
  }
};

Behavior.prototype.destroy = function() {

};

Behavior.define = function(details) {
  var constructor = details.initialize || function() {};
  // delete details.initialize;

  return defineWrapper(Behavior, constructor, details);
};

export default = Behavior;
