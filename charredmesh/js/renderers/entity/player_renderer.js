import Renderer from '../../core/renderer';

var PlayerRenderer = Renderer.define({
  initialize: function PlayerRenderer() {
    var position = new THREE.Vector3().fromArray(this.get('position'));
    var rotation = this.get('rotation');
    var color = this.get('color');

    var material = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setStyle(color).offsetHSL(0,-0.2,0)
    });
    
    var turretMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setStyle(color).offsetHSL(0,-0.2,0)
    });

    var equipmentMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setStyle(color).offsetHSL(0, -0.8, 0),
      shininess:150
    });

    var tracksMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setStyle("#505050")
    });
    
    var tank = tankModel.clone();
    
    tank.traverse(function(obj){
      switch(obj.name){
        case "chassis" :
          obj.material = material;
          break;
        case "turret" :
          obj.material = turretMaterial;
          break;
        case "turret barrel_mount":
          obj.material = turretMaterial;
          break;
        case "turret barrel_mount barrel":
          obj.material = tracksMaterial;
          break;
        case "tracks":
          obj.material = tracksMaterial;
        break;
        case "turret equipment":
          obj.material = equipmentMaterial;
          obj.geometry.computeFaceNormals();
          obj.geometry.computeVertexNormals();
          break;
      }
    });

    this.mesh = new THREE.Object3D();
    this.mesh.position.copy(position);
    this.mesh.add(tank);

    // TODO: Figure out a way to preserve the heirarchy from C4D
    var turret = tank.getObjectByName("turret");
    turret.add(tank.getObjectByName("turret barrel_mount"));
    turret.add(tank.getObjectByName("turret equipment"));
    this.turret = turret;

    var barrel = turret.getObjectByName("turret barrel_mount");
    barrel.add(tank.getObjectByName("turret barrel_mount barrel"));
    this.barrel = barrel;

    // p.set('visible', true);
    
    // add the health bar to all other players
    if (this.get('id') === this.getWorld().get('currentPlayerId')) {
      gunCamera.rotation.y = -Math.PI;
      gunCamera.position.x = 3;
      gunCamera.position.z = 1.0;
      gunCamera.position.y = 1.5;
      this.barrel.add(gunCamera);
    }

    this.changeVisibility(true);
    scene.add(this.mesh);
  },

  changeVisibility: function(nowVisible) {
    // this.changeVisibility(false);
    this.mesh.traverse(function(child){
      child.visible = nowVisible;
    });

    if (this.get('id') !== this.getWorld().get('currentPlayerId')) {
      // players[id].overlay.obj.visible = nowVisible;
    }
  },

  render: function(delta) {
    this.mesh.position.fromArray(this.get('position'));

    this.turret.rotation.y = this.get('turretAngle');
    this.barrel.rotation.x = -this.get('barrelAngle');

    // this.mesh.up.lerp(new THREE.Vector3().fromArray(this.get('up')), 0.2);
    // player.forward.lerp(new THREE.Vector3().fromArray(this.get(forward)), 0.2);
    // this.mesh.lookAt(player.forward.clone().add(this.mesh.position));
  },

  destroy: function() {
    // this.changeVisibility(false);
    scene.remove(this.mesh);
    this.mesh = null;
    this.turret = null;
    this.barrel = null;
  }
});

export default = PlayerRenderer;
