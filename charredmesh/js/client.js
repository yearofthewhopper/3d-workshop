import { entity, ref } from 'core/game';
import World from 'core/world';
import WorldRenderer from 'core/world_renderer';
import NetworkClient from 'core/network/network_client';
import KeyboardHandler from 'keyhandler';
import SoundEngine from 'sound';
import Sun from 'entities/sun';
import Terrain from 'entities/terrain';
import ThreeJSCoreRenderer from 'renderers/world/three_js_core_renderer';
import SkyRenderer from 'renderers/world/sky_renderer';
import TerrainRenderer from 'renderers/world/terrain_renderer';
import ChaseCamRender from 'renderers/world/chase_cam_renderer';
import StatsRenderer from 'renderers/world/stats_renderer';
import Player from 'entities/player';
import Actor from './core/actor';

import PlaySound from 'renderers/entity/play_sound_behavior';

import Debris from 'entities/debris';
import DebrisRenderer from 'renderers/entity/debris_renderer';

import Explosion from 'entities/explosion';
import ExplosionRenderer from 'renderers/entity/explosion_renderer';

import Player from 'entities/player';
import PlayerRenderer from 'renderers/entity/player_renderer';
import DustRenderer from 'renderers/entity/dust_renderer';

import Projectile from 'entities/projectile';
import ProjectileRenderer from 'renderers/entity/projectile_renderer';
import SmokeRenderer from 'renderers/entity/smoke_renderer';

import Splash from 'entities/splash';
import SplashRenderer from 'renderers/entity/splash_renderer';

import Sun from 'entities/sun';
import SunRenderer from 'renderers/entity/sun_renderer';

import Ocean from 'entities/ocean';
import OceanRenderer from 'renderers/entity/ocean_renderer';

window.renderer = null;
window.camera = null;
var element;
window.point = null;
var time;

window.clock = null;

var socket, gameState;

window.tankModel = null;
var keyboard;

window.players = {};

var FIRING_STATE_NONE = 0;
var FIRING_STATE_CHARGING = 1;
var FIRING_STATE_FIRING = 2;

var world = new World({
  previousFirePower : 0,
  firePower : 0,
  firingState : FIRING_STATE_NONE,
  fireTimer : 0
});

var worldRenderer = new WorldRenderer(world);

world.on('explosion', function(data) {
  world.add(new Explosion(data));
});

window.playerId = null;

window.gunCamera = null;
window.gunCameraRenderTarget = null;

window.readyFlags = {
  terrain: false,
  geometry: false,
  audio: false
};

var mapObject = window.mapObject = function mapObject(f, m) {
  var out = {};
  for (var key in m) {
    if (m.hasOwnProperty(key)) {
      out[key] = f(m[key]);
    }
  }
  return out;
}

function playerInput() {
  return {
    fire: false,
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false
  };
}

window.input = playerInput();

function createPlayer(playerData) {
  var position = new THREE.Vector3().fromArray(playerData.position);
  var rotation = playerData.rotation;

  var newPlayer = {
    id: playerData.id,
    health: playerData.health,
    name: playerData.name,
    color: playerData.color,
    forward: new THREE.Vector3(),
    barrelDirection: new THREE.Vector3()
  };

  console.log(newPlayer.name + " has entered the game!");

  var material = new THREE.MeshLambertMaterial({
    color: new THREE.Color().setStyle(newPlayer.color).offsetHSL(0,-0.2,0)
  });
  
  var turretMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color().setStyle(newPlayer.color).offsetHSL(0,-0.2,0)
  });

  var equipmentMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color().setStyle(newPlayer.color).offsetHSL(0, -0.8, 0),
    shininess:150
  });

  var tracksMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color().setStyle("#505050")
  });
  
  tank = tankModel.clone();
  
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

  newPlayer.obj = new THREE.Object3D();
 
  newPlayer.obj.position.copy(position);
  
  newPlayer.obj.add(tank);

  // TODO: Figure out a way to preserve the heirarchy from C4D
  var turret = tank.getObjectByName("turret");
  turret.add(tank.getObjectByName("turret barrel_mount"));
  turret.add(tank.getObjectByName("turret equipment"));
  var barrel = turret.getObjectByName("turret barrel_mount");
  barrel.add(tank.getObjectByName("turret barrel_mount barrel"));

  newPlayer.turret = turret;
  newPlayer.barrel = barrel;

  var p = new Player(playerData);
  p.sync({
    visible: true,
    position: newPlayer.obj.position.toArray()
  });
  world.add(p);
  
  // add the health bar to all other players
  if(newPlayer.id != playerId){
    var overlayCanvas = makeCanvas(100, 20);
    var ctx = overlayCanvas.getContext("2d");

    var overlayTexture = new THREE.Texture(overlayCanvas);
    overlayTexture.needsUpdate = true;

    var overlaygeom = new THREE.PlaneGeometry(50, 10);
    var overlaymaterial = new THREE.MeshBasicMaterial({
      map : overlayTexture,
      transparent:true
    });
    
    var overlay = new THREE.Mesh(overlaygeom, overlaymaterial);
    overlay.rotation.y = -Math.PI;
    overlay.position.y = 50;
    scene.add(overlay);

    newPlayer.overlay = {
      texture : overlayTexture,
      canvas : overlayCanvas,
      material : overlaymaterial,
      obj : overlay,
    };
  } else {
    gunCamera.rotation.y = -Math.PI;
    gunCamera.position.x = 3;
    gunCamera.position.z = 1.0;
    gunCamera.position.y = 1.5;
    newPlayer.barrel.add(gunCamera);
  }
  
  scene.add(newPlayer.obj);
  players[newPlayer.id] = newPlayer;
}

// function createProjectile(projectile) {
//   if (projectile.owner == playerId){
//     world.set('firingState', FIRING_STATE_FIRING);
//   }

//   world.add(new Projectile(projectile));
// }

function updatePlayer(player) {
  players[player.id].barrelDirection.fromArray(player.barrelDirection);

  var playerInstance = world.getEntity(Player, player.id);

  players[player.id].obj.position.fromArray(player.position);

  var lastPositionVector = playerInstance.lastPositionVector || new THREE.Vector3();
  players[player.id].rotation = player.rotation;

  playerInstance.sync(player);

  var velocity = playerInstance.getVelocityVector();

  if (players[player.id].overlay){
    players[player.id].overlay.obj.position.fromArray(player.position);
    players[player.id].overlay.obj.position.y += 50;
  }

  players[player.id].turret.rotation.y = player.turretAngle;

  players[player.id].driving = player.driving;

  players[player.id].score = player.score;
  players[player.id].barrel.rotation.x = -player.barrelAngle;

  players[player.id].obj.up.lerp(new THREE.Vector3().fromArray(player.up), 0.2);
  players[player.id].forward.lerp(new THREE.Vector3().fromArray(player.forward), 0.2);
  players[player.id].obj.lookAt(players[player.id].forward.clone().add(players[player.id].obj.position));

  players[player.id].health = player.health;
  if (player.id !== playerId) {
    updateOverlay(players[player.id]);
  }
}

function updateOverlay( player ){
  var canvas = player.overlay.canvas;

  var ctx = player.overlay.canvas.getContext("2d");

  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, Math.max(0, player.health/100 * canvas.width), canvas.height);
  
  player.overlay.texture.needsUpdate = true;
}

function updateGameState(state) {
  gameState = state;
  mapObject(updatePlayer, gameState.players);
  mapObject(function(p) { return world.syncEntity(Projectile, p); }, gameState.projectiles);

  updateTerrainChunks();
}

function projectileExplode(id) {
  if (playerId == id){
    world.set('firingState', FIRING_STATE_NONE);
  }

  var projectile = world.getEntity(Projectile, id);
  projectile.trigger('explode');
  world.remove(projectile);
  delete gameState.projectiles[id];
}

function initSocket() {
  socket = io.connect();

  new NetworkClient(world, socket, Actor.byName);

  socket.on('welcome', function(data) {
    //console.log('game state ', data);
    playerId = data.id;
    gameState = data.state;
    mapObject(createPlayer, gameState.players);
    // mapObject(createProjectile, gameState.projectiles);
  });

  socket.on('playerJoin', function(data) {
    console.log('player join ', data);
    createPlayer(data);
  });
  
  socket.on('playerUpdate', updatePlayer);
  socket.on('loopTick', updateGameState);

  // socket.on('projectileAppear', createProjectile);
  socket.on('projectileExplode', projectileExplode);

  socket.on('playerDisconnect', function(id) {
    console.log("Player removed.");
    projectileExplode(id);
    var oldPlayer = players[id];
    scene.remove(oldPlayer.obj);
    scene.remove(oldPlayer.overlay.obj);
    delete gameState.players[id];
    delete players[id];
  });

  world.pipeSocketEvent(socket, 'terrainUpdate');
  world.pipeSocketEvent(socket, 'playerDied');
  world.pipeSocketEvent(socket, 'playerSpawned');
}

// check to see when all the various async stuff is done loading.
var checkReadyState = window.checkReadyState = function checkReadyState(){
  var ready = true;

  mapObject(function(item){
    ready = ready && item;
  }, readyFlags);

  if(ready){
    initSocket();
  }
}

function init(){
  keyboard = new KeyboardHandler(onKeyChange);

  window.addEventListener('resize', function() {
    world.trigger('resize');
  }, false);

  SoundEngine.initialize(function(){
    readyFlags.audio = true;
    checkReadyState();
  });

  worldRenderer.onEntity(Debris, DebrisRenderer, { position: entity('position'), size: ref('size'), life: ref('life') });

  worldRenderer.onEntity(Explosion, PlaySound,         { soundName: 'explosion', onEvent: 'didInitialize', position: entity('position') });
  worldRenderer.onEntity(Explosion, ExplosionRenderer, { position: entity('position'), color: entity('color') });
  
  worldRenderer.onEntity(Player, PlayerRenderer, {}, entity('visible'));
  worldRenderer.onEntity(Player, DustRenderer,   { position: entity('position') }, entity('driving'));

  worldRenderer.onEntity(Projectile, ProjectileRenderer, { position: entity('position'), color: ref('color') });
  worldRenderer.onEntity(Projectile, PlaySound,          { soundName: 'fire', onEvent: 'didInitialize', position: entity('position') });
  worldRenderer.onEntity(Projectile, SmokeRenderer,      { position: entity('position') });

  worldRenderer.onEntity(Splash, PlaySound,      { soundName: 'splash', onEvent: 'didInitialize', position: entity('position') });
  worldRenderer.onEntity(Splash, SplashRenderer, { position: entity('position') });
  
  worldRenderer.onEntity(Sun, SunRenderer, { positionVector: ref('positionVector') });

  worldRenderer.onEntity(Ocean, OceanRenderer, {});

  var sun = new Sun();
  window.sunPosition = sun.positionVector;

  worldRenderer.onWorld(ThreeJSCoreRenderer);
  worldRenderer.onWorld(SkyRenderer);
  worldRenderer.onWorld(TerrainRenderer);
  
  world.add(new Terrain());
  world.add(new Ocean());

  worldRenderer.onWorld(ChaseCamRender);
  worldRenderer.onWorld(StatsRenderer);
  // worldRenderer.onWorld(HUDRenderer)

  world.add(sun);
  
  // Start renderframes
  onFrame();
}

function onKeyChange(code, state) {
  var firingState = world.get('firingState');
  switch(code)
  {
  case 32:

    if(state && firingState == FIRING_STATE_NONE) {
      world.sync({
        'fireTimer': time,
        'firingState': FIRING_STATE_CHARGING
      });
    }

    if(!state && firingState == FIRING_STATE_CHARGING) {
      var firePower = world.get('firePower');
      world.set('previousFirePower', firePower);
      socket.emit('playerFire', {"power" : firePower});
    }

    input.fire = state;
    return;
    break;
  case 87: // W
    input.forward = state;
    break;
  case 83: // S
    input.back = state;
    break;
  case 65: // A
    input.left = state;
    break;
  case 68: // D
    input.right = state;
    break;
  case 82: // R
  case 38: // Up arrow
    input.up = state;
    break;
  case 70: // F
  case 40: // down arrow
    input.down = state;
    break;

  case 39: // right arrow
    input.turretRight = state;
    break;
  
  case 37: // left arrow
    input.turretLeft = state;
    break;
  case 69: // e
    input.aim = state;
    break;
  }
  
  socket.emit('playerInput', input);
}

function onFrame() {
  requestAnimationFrame(onFrame);

  var delta = clock.getDelta();

  world.tick(delta);

  time += delta;

  if (input.fire) {
    var firePower = Math.sin((time - world.get('fireTimer')) + (3 * Math.PI / 2));
    world.set('firePower', (firePower + 1) / 2);
  }

  worldRenderer.render(delta);
}

function makeCanvas(width, height){
  var canvas = document.createElement("canvas");
  
  canvas.width = width;
  canvas.height = height;

  canvas.style.position = "absolute";
  canvas.style.zIndex = 100000;

  document.body.appendChild(canvas);

  return canvas;
}

init();
