// var maxHealthColor = new THREE.Color(0x00ff00);
// var minHealthColor = new THREE.Color(0xff0000);

// function HUDRenderer(world) {
//   this.projectiles = {};

//   this.prepare();
// }

// HUDRenderer.prototype.prepare = function() {
//   this.aspectRatio = window.innerWidth / window.innerHeight;

//   var hudScene = new THREE.Scene();
//   var hudCamera = new THREE.PerspectiveCamera(45, this.aspectRatio, 1, 22500);
  
//   hudCamera.lookAt(new THREE.Vector3(0, 0, -1));
//   var overlayCanvas = makeCanvas(512, 512);
//   var ctx = overlayCanvas.getContext("2d");

//   var overlayTexture = new THREE.Texture(overlayCanvas);
//   overlayTexture.needsUpdate = true;

//   var overlaygeom = new THREE.PlaneGeometry(50, 50);
//   var overlaymaterial = new THREE.MeshBasicMaterial({
//     map : overlayTexture,
//     transparent:true,
//     blending:THREE.AdditiveBlending,
//     depthTest: false
//   });
  
//   var radarMesh = new THREE.Mesh(overlaygeom, overlaymaterial);
  
//   radarMesh.position.set( 50, -30, -150 );
//   radarMesh.rotation.y = -30 * Math.PI / 180;

//   hudScene.add(radarMesh);

//   var camMesh = new THREE.Mesh(overlaygeom, new THREE.MeshBasicMaterial({
//     map: gunCameraRenderTarget,
//     depthTest: false,
//     color: 0x20ff20,
//     transparent:true,
//     blending:THREE.AdditiveBlending
//   }));
  
//   camMesh.position.set( -50, -30, -150 );
//   camMesh.rotation.y = 30 * Math.PI / 180;

//   hudScene.add(camMesh);

//   this.scene = hudScene;
//   this.camera = hudCamera;
//   this.gunCam = {
//     obj: camMesh
//   }
//   this.radar = {
//     obj: radarMesh, 
//     canvas: overlayCanvas,
//     texture: overlayTexture
//   };

//   this.resize();
// }

// HUDRenderer.prototype.createEntity = function(entity) {
//   this.projectiles[entity.get('id')] = entity;
// };

// HUDRenderer.prototype.renderEntity = function(entity) {
//   // no-op
// };

// HUDRenderer.prototype.removeEntity = function(entity) {
//   // delete this.projectiles[entity.get('id')];
// };

// HUDRenderer.prototype.beforeRender = function() {
//   if(!playerId){
//     return;
//   }

//   var radarRange = 6000;
//   var radarCanvasScale = (radarRange * 2) / this.radar.canvas.width;

//   var ctx = this.radar.canvas.getContext("2d");
//   ctx.clearRect(0,0,this.radar.canvas.width, this.radar.canvas.height);
//   ctx.fillStyle = "rgba(0, 160, 0, 0.35)";

      
//   this.radar.texture.needsUpdate = true;

//   var currentPlayer = players[playerId];

//   ctx.save();
//   ctx.translate(this.radar.canvas.width/2, this.radar.canvas.height/2);
  
//   ctx.beginPath();
//   ctx.arc(0, 0, (this.radar.canvas.width / 2), 0, 2 * Math.PI, false);
//   ctx.fill();
  
//   ctx.rotate( currentPlayer.rotation - Math.PI );
  
//   ctx.fillStyle = "rgba(0, 255, 0, 0.75)";
//   ctx.fillRect(-5,-5, 10, 10);
  
//   var point = new THREE.Vector2();

//   mapObject(function(player) {
//     var distance = currentPlayer.obj.position.distanceTo( player.obj.position );

//     if(distance < radarRange) {
//       var dotX = player.obj.position.x - currentPlayer.obj.position.x;
//       var dotY = player.obj.position.z - currentPlayer.obj.position.z;
//       dotX /= radarCanvasScale;
//       dotY /= radarCanvasScale;
//       ctx.fillStyle = player.color; // "rgba(0, 255, 0, 0.75)";
//       ctx.fillRect(dotX-5,dotY-5, 10, 10);
//     }
//     else {
//       var dotX = player.obj.position.x - currentPlayer.obj.position.x;
//       var dotY = player.obj.position.z - currentPlayer.obj.position.z;
      
//       point.set(dotX, dotY);

//       point.normalize().multiplyScalar(this.radar.canvas.width / 2);
//       ctx.fillStyle = player.color;
//       ctx.fillRect(point.x-2, point.y-2, 5, 5);
//     }

//   }, players);



//   mapObject(function(projectile) {
//     var pos = new THREE.Vector3();
//     pos.fromArray(projectile.get('position'));

//     var distance = currentPlayer.obj.position.distanceTo(pos);

//     if(distance < radarRange) {
//       var dotX = pos.x - currentPlayer.obj.position.x;
//       var dotY = pos.z - currentPlayer.obj.position.z;
//       dotX /= radarCanvasScale;
//       dotY /= radarCanvasScale;
//       ctx.fillStyle = players[projectile.get('owner')].color; // "rgba(0, 255, 0, 0.75)";
//       ctx.beginPath();
//       ctx.arc(dotX-5, dotY-5, 5, 0, Math.PI * 2, true);
//       ctx.fill();
//     }
//   }, this.projectiles);


//   ctx.restore();

  
//   ctx.fillStyle = "rgba(125, 125, 125, 0.5)";
//   ctx.fillRect(0, 0, this.radar.canvas.width, 20);
//   ctx.fillRect(0, this.radar.canvas.height-20, this.radar.canvas.width, 20);
  

//   ctx.fillStyle = "rgba(200, 0, 0, 0.75)";
//   ctx.fillRect(this.radar.canvas.width * world.get('previousFirePower'), 0, 4, 20);

//   if(world.get('firingState') == FIRING_STATE_CHARGING){
//     ctx.fillStyle = "rgba(255, 0, 0, 1)";
//     ctx.fillRect(0, 0, this.radar.canvas.width * world.get('firePower'), 20);
//   }

//   var health = players[playerId].health;
//   var healthColor = interpolateColor(maxHealthColor, minHealthColor, health * 0.01);
  
//   ctx.fillStyle = healthColor.getStyle();
//   ctx.fillRect(0, this.radar.canvas.height-20, this.radar.canvas.width * health*0.01, 20);

//   renderer.render(scene, gunCamera, gunCameraRenderTarget, true);
// };

// HUDRenderer.prototype.afterRender = function() {
//   renderer.render(this.scene, this.camera);
// };

// HUDRenderer.prototype.resize = function() {
//   this.aspectRatio = window.innerWidth / window.innerHeight;
//   this.camera.aspect = this.aspectRatio;
//   this.camera.updateProjectionMatrix();
  
//   this.radar.obj.position.x = 40 * this.aspectRatio;
//   this.radar.obj.position.y = -50 / this.aspectRatio;

//   this.gunCam.obj.position.x = -40 * this.aspectRatio;
//   this.gunCam.obj.position.y = -50 / this.aspectRatio;
// };

// function interpolateColor(max, min, level) {
//   return min.clone().lerp(max, level);
// }
