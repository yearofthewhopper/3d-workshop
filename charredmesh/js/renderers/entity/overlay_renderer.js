import Renderer from '../../core/renderer';

export default = Renderer.define({
  initialize: function OverlayRenderer() {
    if (this.getWorld().get('currentPlayerId') === this.get('id')) { return; }

    var overlayCanvas = document.createElement("canvas");
    
    overlayCanvas.width = 100;
    overlayCanvas.height = 20;

    overlayCanvas.style.position = "absolute";
    overlayCanvas.style.zIndex = 100000;

    document.body.appendChild(overlayCanvas);

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

    this.mesh = overlay;
    this.texture = overlayTexture;
    this.canvas = overlayCanvas;
  },

  render: function(delta) {
    if (!this.mesh) { return };
    var canvas = this.canvas;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, Math.max(0, this.get('health')/100 * canvas.width), canvas.height);
    
    this.texture.needsUpdate = true;
    this.mesh.position.fromArray(this.get('position'));
    this.mesh.position.y += 50;
  },

  destroy: function() {
    if (this.mesh) {
      scene.add(this.mesh);
    }
  }
});
