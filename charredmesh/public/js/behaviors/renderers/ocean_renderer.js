var OceanRenderer = Game.Behavior.define({
  initialize: function OceanRenderer() {
    var oceanGeom = new THREE.PlaneGeometry(16384*10, 16384*10, 28, 28);

    this.oceanUniforms = {
      time: { type: 'f', value: 1.0 },
      fogColor:    { type: "c", value: scene.fog.color },
      fogNear:     { type: "f", value: scene.fog.near },
      fogFar:      { type: "f", value: scene.fog.far },
      skyColor: { type: "t", value: THREE.ImageUtils.loadTexture("textures/sky.png") },
      sunGlow: { type: "t", value: THREE.ImageUtils.loadTexture("textures/glow.png") },
      lightDirection : { type: "v3", value: sunPosition }
    };

    this.oceanMaterial = new THREE.ShaderMaterial({
      uniforms: this.oceanUniforms,
      transparent: true,
      vertexShader: loadShaderSource("vertex-passthrough"),
      fragmentShader: loadShaderSource("fragment-water"),
      fog:true
    });

    var ocean = new THREE.Mesh( oceanGeom, this.oceanMaterial );
   
    var seaFloor = new THREE.Mesh( oceanGeom, new THREE.MeshLambertMaterial({
      map: THREE.ImageUtils.loadTexture("textures/terrain/tile_sand.png"),
      fog:true
    }) );

    seaFloor.rotation.x = -Math.PI / 2;
    seaFloor.position.y = -2.5;

    scene.add(seaFloor);
    
    ocean.rotation.x = -Math.PI / 2;

    // TODO: add dynamic sea level.
    ocean.position.set(8192, 40.5, 8192);
    ocean.name = "ocean";
    
    scene.add(ocean);
  },

  onMessage: function(eventName, data) {
    if (eventName === 'render') {
      this.render.apply(this, data);
    }
  },

  render: function(delta) {
    this.oceanUniforms.time.value += 0.01;
  }
});
