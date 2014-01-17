var ExplosionRenderer = (function() {
  return makeBehavior(ExplosionRenderer, withRenderer);

  function prepareRender() {
    var explosionmaterial = new THREE.MeshBasicMaterial({
      color: this.getOption('color'),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest:true,
      depthWrite:false
    });

    var explosiongeom = new THREE.SphereGeometry(1, 16, 16);
    var explosionmesh = new THREE.Mesh(explosiongeom, explosionmaterial);

    explosionmesh.position.copy(this.getOption('position'));

    scene.add(explosionmesh);
    this.mesh = explosionmesh;
  }

  function onRender(delta) {
    if (!this.prepared) {
      prepareRender.call(this);
      this.prepared = true;
    }

    var time = this.entity.get('time');
    var radius = Math.log(time * 1000) * 40;

    if (time > 0.5) {
      this.mesh.material.opacity -= delta * 2;
    }
    this.mesh.scale.set(radius, radius, radius);
  }

  function tearDown() {
    scene.remove(this.mesh);
    this.mesh = null;
  }

  function ExplosionRenderer() {
    this.onRender = onRender;

    this.on('before:initialize', function() {
      this.prepared = false;
    });

    this.onExplosionComplete = tearDown;
  }
}).call(this);
