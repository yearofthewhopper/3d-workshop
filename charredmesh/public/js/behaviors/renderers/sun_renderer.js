var SunRenderer = Game.Behavior.define({
  initialize: function SunRenderer() {
    var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( 0.7, 0.35, 0 ).normalize();
    dirLight.position.multiplyScalar( 50 );
    dirLight.name = "sun";

    scene.add( dirLight );
    this.light = dirLight;

    this.sunUniforms = {
        position: { type: 'v3', value: new THREE.Vector3() },
        time: { type: 'f', value: 1.0 }
    };
    var sunBillboard = new THREE.Mesh( new THREE.SphereGeometry(6000,6000, 16, 16), new THREE.ShaderMaterial( {
      uniforms : this.sunUniforms,
      vertexShader: loadShaderSource('vertex-sun'),
      fragmentShader: loadShaderSource('fragment-sun')
    } ) );
    sunBillboard.name = "sunBillboard";
    scene.add(sunBillboard);
    this.mesh = sunBillboard;
  },

  onMessage: function(eventName, data) {
    if (eventName === 'render') {
      this.render.apply(this, data);
    }
  },

  render: function(delta) {
    var pos = this.getOption('positionVector');

    this.mesh.position.set( camera.position.x + pos.x * 13000, pos.y * 13000, camera.position.z + pos.z * 5000 );

    this.sunUniforms.time.value += delta;
    this.sunUniforms.position.value = this.mesh.position;
  }
});
