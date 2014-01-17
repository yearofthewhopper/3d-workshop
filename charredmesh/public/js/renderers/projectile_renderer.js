function ProjectileRenderer(world) {
  this.projectiles = {};
  this.projectileDirtyLookup = {};

  this.constructor.call(this, world);

  this.prepare();
}
ProjectileRenderer.inherits(Renderer);
ProjectileRenderer.listensTo = ['entity:projectile'];

ProjectileRenderer.prototype.prepare = function() {
};

ProjectileRenderer.prototype.createEntity = function(projectile) {
  var projectilematerial = new THREE.MeshLambertMaterial({
    color: players[projectile.get('owner')].color,
    emissive: 0x222222
  });
  var projectilegeom = new THREE.CylinderGeometry(0, caliber, 20, 16);
  var projectilemesh = new THREE.Mesh(projectilegeom, projectilematerial);
  var projectileobj = new THREE.Object3D();
  projectilemesh.rotation.x = Math.PI / 2;
  projectileobj.add(projectilemesh);
  projectileobj.position.fromArray(projectile.get('position'));

  projectileobj.lookAt(
    projectileobj.position.clone().add(
      new THREE.Vector3().fromArray(projectile.get('velocity'))));

  scene.add(projectileobj);
  projectileobj.model = projectile;

  this.projectiles[projectile.get('id')] = projectileobj;
};

ProjectileRenderer.prototype.renderEntity = function(projectile) {
  var id = projectile.get('id');
  var dirty = false;

  if (!this.projectileDirtyLookup[id]) {
    dirty = true;
  } else {
    dirty = !mori.equals(this.projectileDirtyLookup[id], projectile.state);
  }

  if (dirty) {
    this.projectileDirtyLookup[id] = projectile.state;

    this.projectiles[id].position.fromArray(projectile.get('position'));
    this.projectiles[id].lookAt(
      this.projectiles[id].position.clone().add(
        new THREE.Vector3().fromArray(projectile.get('velocity')))); 
  }
};

ProjectileRenderer.prototype.removeEntity = function(projectile) {
  var id = projectile.get('id');
  
  if (!this.projectiles[id]){
    return;
  }

  var oldProjectile = this.projectiles[id];

  scene.remove(oldProjectile);
  this.projectiles[id].model = null;
  delete this.projectiles[id];
  delete this.projectileDirtyLookup[id];

  explosion = new Explosion(oldProjectile.position, players[id].color);
  scene.add(explosion.obj);
  effectQueue.push(explosion);
};

function Explosion(position, color) {
  var explosionmaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest:true,
    depthWrite:false
  });


  charredmesh.sound.playSound("explosion", position.clone());

  var explosiongeom = new THREE.SphereGeometry(1, 16, 16);
  var explosionmesh = new THREE.Mesh(explosiongeom, explosionmaterial);
  explosionmesh.position = position;


  this.obj = explosionmesh;
  this.time = 0;
  this.radius = 1;
  this.opacity = 1;
  this.update = function(delta) {
    this.time += delta;
    this.radius = Math.log(this.time * 1000) * 40;

    if (this.time > 0.5) {
      this.opacity -= delta * 2;
    }
    this.obj.scale.set(this.radius, this.radius, this.radius);
    this.obj.material.opacity = this.opacity;


  };
  this.remove = function() {
    scene.remove(this.obj);
  };
  this.isDone = function() {
    return this.time > 1;
  };
}
