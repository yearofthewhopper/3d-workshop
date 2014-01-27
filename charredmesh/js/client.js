import { property, ref } from 'core/game';
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
import HUDRenderer from 'renderers/world/hud_renderer';
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
import OverlayRenderer from 'renderers/entity/overlay_renderer';

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
var time = 0;

window.clock = null;

window.socket = null;

window.tankModel = null;

window.sunPosition = new THREE.Vector3();

var world = new World();

var worldRenderer = new WorldRenderer(world);

world.on('explosion', function(data) {
  world.add(new Explosion(data));
});

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

function initSocket() {
  socket = io.connect();

  socket.on('welcome', function(data) {
    world.set('currentPlayerId', data.id);

    new NetworkClient(world, socket, Actor.byName);

    socket.emit('ready');
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
  new KeyboardHandler(function(keyCode, keyValue) {
    world.trigger('inputChange', [{ code: keyCode, state: keyValue }]);
  });

  window.addEventListener('resize', function() {
    worldRenderer.resize();
  }, false);

  SoundEngine.initialize(function(){
    readyFlags.audio = true;
    checkReadyState();
  });

  worldRenderer.onEntity(Debris, DebrisRenderer, { position: property('position'), size: ref('size'), life: ref('life') });

  worldRenderer.onEntity(Explosion, PlaySound,         { soundName: 'explosion', onEvent: 'didInitialize', position: property('position') });
  worldRenderer.onEntity(Explosion, ExplosionRenderer, { position: property('position'), color: property('color') });
  
  worldRenderer.onEntity(Player, PlayerRenderer,  {});
  worldRenderer.onEntity(Player, DustRenderer,    { position: property('position') }, property('driving'));
  worldRenderer.onEntity(Player, OverlayRenderer, {});

  worldRenderer.onEntity(Projectile, ProjectileRenderer, { position: property('position'), color: ref('color') });
  worldRenderer.onEntity(Projectile, PlaySound,          { soundName: 'fire', onEvent: 'didInitialize', position: property('position') });
  worldRenderer.onEntity(Projectile, SmokeRenderer,      { position: property('position') });

  worldRenderer.onEntity(Splash, PlaySound,      { soundName: 'splash', onEvent: 'didInitialize', position: property('position') });
  worldRenderer.onEntity(Splash, SplashRenderer, { position: property('position') });
  
  worldRenderer.onEntity(Sun, SunRenderer, {});

  worldRenderer.onEntity(Ocean, OceanRenderer, {});

  worldRenderer.onWorld(ThreeJSCoreRenderer);
  worldRenderer.onWorld(SkyRenderer);
  worldRenderer.onWorld(TerrainRenderer);
  
  world.add(new Terrain());
  world.add(new Ocean());

  worldRenderer.onWorld(ChaseCamRender);
  worldRenderer.onWorld(StatsRenderer);
  worldRenderer.onWorld(HUDRenderer)
  
  // Start renderframes
  onFrame();
}

function onFrame() {
  requestAnimationFrame(onFrame);

  var delta = clock.getDelta();

  world.tick(delta);

  worldRenderer.render(delta);
}

init();
