// import Renderer from '../../core/renderer';

// function PlayerSoundRenderer(world) {
//   this.players = {};

//   this.constructor.call(this, world);
// }
// PlayerSoundRenderer.prototype.createEntity = function(player) {
//   var id = player.get('id');

//   if (playerId !== id) {
//     return;
//   }

//   this.players[id] = {
//     motorSound: SoundEngine.getSound("motor"),
//     trackSound: SoundEngine.getSound("tracks"),
//     rotateSound: SoundEngine.getSound("rotate")
//   };

//   this.players[id].rotateSound.gain.value = 0;
// };

// PlayerSoundRenderer.prototype.renderEntity = function(player) {
//   var id = player.get('id');

//   if (playerId !== id) {
//     return;
//   }

//   var velocity = player.getVelocityVector();

//   var motorGain = player.get('driving') ? 1 : 0.4;
//   var motorPitch = 0.5 + (velocity.length() / 10);
//   motorPitch = Math.min(2.5, motorPitch);

//   this.players[id].motorSound.gain.value += (motorGain - this.players[id].motorSound.gain.value) * 0.1;
//   this.players[id].motorSound.playbackRate.value += (motorPitch - this.players[id].motorSound.playbackRate.value) * 0.2;
  
//   var trackGain = (Math.min(velocity.length(), 10) / 20);
//   trackGain = Math.max(trackGain, input.left || input.right ? 0.25 : 0);

//   this.players[id].trackSound.gain.value += (trackGain - this.players[id].trackSound.gain.value) * 0.2;
//   this.players[id].trackSound.playbackRate.value += (motorPitch - this.players[id].trackSound.playbackRate.value) * 0.2;

//   var pos = player.getPositionVector();
//   this.players[id].motorSound.panner.setPosition(pos.x, pos.y, pos.z);
//   this.players[id].trackSound.panner.setPosition(pos.x, pos.y, pos.z);
//   this.players[id].rotateSound.panner.setPosition(pos.x, pos.y, pos.z);

//   var rotateGain = 0;
//   if (input.turretRight || input.turretLeft || input.up || input.down) {
//     rotateGain = 0.3;
//   }
//   this.players[id].rotateSound.gain.value += (rotateGain - this.players[id].rotateSound.gain.value) * 0.3;
//   this.players[id].rotateSound.playbackRate.value += ((rotateGain*6) - this.players[id].rotateSound.playbackRate.value) * 0.3;
// };

// PlayerSoundRenderer.prototype.removeEntity = function(player) {
//   var id = player.get('id');
  
//   if (!this.players[id]){
//     return;
//   }

//   // Deactivate player Sound?

//   delete this.players[id];
// };

// export default = PlayerSoundRenderer;
