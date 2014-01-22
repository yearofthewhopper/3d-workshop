import Entity from 'core/entity';
import OceanRenderer from 'behaviors/renderers/ocean_renderer';

var Ocean = Entity.define({
  behaviors: [
    [OceanRenderer, {}]
  ],

  initialize: function Ocean() {
  }
});

export default = Ocean;
