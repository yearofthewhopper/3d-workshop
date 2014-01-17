var skyColor = 0xf3e4d3;
var skyDome;

function SkyRenderer(world) {
  this.constructor.call(this, world);

  this.prepare();
}
SkyRenderer.inherits(Renderer);
SkyRenderer.listensTo = [];

SkyRenderer.prototype.prepare = function() {
  // LIGHTS
  var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.2 );
  hemiLight.color.setHSL( 0.6, 1, 0.6 );
  hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
  hemiLight.position.set( 0, 500, 0 );
  hemiLight.name = "sky";
  scene.add( hemiLight );

  var skyUniforms = {
    skyColor: { type: "t", value: THREE.ImageUtils.loadTexture("textures/sky.png") },
    sunGlow: { type: "t", value: THREE.ImageUtils.loadTexture("textures/glow.png") },
    // stars: { type: "t", value: THREE.ImageUtils.loadTexture("textures/stars.png") },
    lightDirection : { type: "v3", value: sunPosition }
  };

  skyMaterial = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: loadShaderSource("vertex-sky"),
    fragmentShader: loadShaderSource("fragment-sky"),
    transparent:true,
    depthRead:false,
    depthWrite:false
  });

  skyDome = new THREE.Mesh( new THREE.SphereGeometry( 1, 12, 12, 0, Math.PI*2, 0, Math.PI*2 ), skyMaterial );
  skyDome.scale.set(14000, 14000, 14000);
  scene.add(skyDome);

  scene.fog = new THREE.Fog(skyColor, 4000, 9000);
};
