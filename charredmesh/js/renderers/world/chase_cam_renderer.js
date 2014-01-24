import SoundEngine from 'sound';
import Player from 'entities/player';

var cameraTarget = new THREE.Vector3();

var ChaseCamRender = function(world) {
  this.world = world;
};

ChaseCamRender.prototype.render = function() {
  var currentPlayerId = this.world.get('currentPlayerId');

  // don't try to update the camera if the player hasn't been instantiated yet.
  if (!currentPlayerId){
    return;
  }

  var player = this.world.getEntity(Player, currentPlayerId);
  
  // don't try to update the camera if the player hasn't been instantiated yet.
  if (!player){
    return;
  }

  var rotation = player.get('rotation');
  var barrelDirection = new THREE.Vector3().fromArray(player.get('barrelDirection'));
  var playerPos = new THREE.Vector3().fromArray(player.get('position'));
  var cameraPositionVec = playerPos.clone();
  cameraPositionVec.y += 100;
  cameraPositionVec.z -= Math.cos(rotation) * 300;
  cameraPositionVec.x -= Math.sin(rotation) * 300;

  // Use larger of either an offset from the players Y position, or a point above the ground.  
  // This prevents the camera from clipping into mountains.
  cameraPositionVec.y = Math.max( terrain.getGroundHeight(cameraPositionVec.x, cameraPositionVec.z) + 75, cameraPositionVec.y);

  // constantly lerp the camera to that position to keep the motion smooth.
  camera.position.lerp(cameraPositionVec, 0.05);

  SoundEngine.setListenerPosition(camera.position, cameraTarget.clone().sub(camera.position).normalize());

  // Find a spot in front of the player
  var cameraTargetVec = playerPos.clone();
  cameraTargetVec.z += Math.cos(rotation) * 300;
  cameraTargetVec.x += Math.sin(rotation) * 300;

  // constantly lerp the target position too, again to keep things smooth.
  cameraTarget.lerp(cameraTargetVec, 0.2);

  // look at that spot (looking at the player makes it hard to see what's ahead)  
  camera.lookAt(cameraTarget);

  // mapObject(function(player){
  //   // console.log(player.obj.position.x);
  //   if(player.overlay){
  //     player.overlay.obj.lookAt(camera.position);
  //   }
  // }, players);

  skyDome.position.copy(camera.position);
  skyDome.position.y = 0;
};

ChaseCamRender.prototype.resize = function chaseCamRender() {
};

export default = ChaseCamRender;
