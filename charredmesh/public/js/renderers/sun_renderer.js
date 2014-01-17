function SunRenderer(world) {
  this.constructor.call(this, world);

  this.prepare();
}
SunRenderer.inherits(Renderer);
SunRenderer.listensTo = ['entity:sun', 'after:render'];

SunRenderer.prototype.createEntity = function() {};
SunRenderer.prototype.removeEntity = function() {};

SunRenderer.prototype.prepare = function() {
  var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  
  dirLight.color.setHSL( 0.1, 1, 0.95 );
  dirLight.position.set( 0.7, 0.35, 0 ).normalize();
  dirLight.position.multiplyScalar( 50 );
  dirLight.name = "sun";

  scene.add( dirLight );

  sunUniforms = {
      position: { type: 'v3', value: new THREE.Vector3() },
      time: { type: 'f', value: 1.0 }
  };
  var sunBillboard = new THREE.Mesh( new THREE.SphereGeometry(6000,6000, 16, 16), new THREE.ShaderMaterial( {
    uniforms : sunUniforms,
    vertexShader: loadShaderSource('vertex-sun'),
    fragmentShader: loadShaderSource('fragment-sun')
  } ) );
  sunBillboard.name = "sunBillboard";
  scene.add(sunBillboard);
};

SunRenderer.prototype.renderEntity = function(sun) {
  scene.getObjectByName("sunBillboard").position.set( camera.position.x + sun.positionVector.x * 13000, sun.positionVector.y * 13000, camera.position.z + sun.positionVector.z * 5000 );
};

SunRenderer.prototype.afterRender = function(delta, renderer) {
  sunUniforms.time.value += delta;//time;
  sunUniforms.position.value = scene.getObjectByName("sunBillboard").position;
};
