var charredmesh = charredmesh || {};

charredmesh.Terrain = function() {

	this.terrainDataWidth = 1024;
	this.terrainDataHeight = 1024;

	this.terrainData = null;

	this.terrainHeightScale = 1.5;
	this.worldUnitsPerDataPoint = 16;
}

charredmesh.Terrain.prototype.loadRGBA = function(data) {
	
	this.terrainData = [];
	var count = this.terrainDataWidth * this.terrainDataHeight;

	for(var i = 0; i < count; i++){
		this.terrainData[i] = data[i*4] * this.terrainHeightScale;
	} 
}

charredmesh.Terrain.prototype.loadBase64Data = function(data) {

	var buffer = Util.decodeBase64(data);
	
	this.terrainData = [];
	var count = this.terrainDataWidth * this.terrainDataHeight;

	for(var i = 0; i < count; i++){
		this.terrainData[i] = buffer.getUint8(i) * this.terrainHeightScale;
	} 
}

charredmesh.Terrain.prototype.worldToTerrain = function(worldCoordinate) {
	return worldCoordinate / this.worldUnitsPerDataPoint;
}

charredmesh.Terrain.prototype.terrainToWorld = function(terrainCoordinate) {
	return terrainCoordinate * this.worldUnitsPerDataPoint;
}



charredmesh.Terrain.prototype.getGroundNormal = function(worldX, worldY) {
	// todo: implement this.
	return [0, 1, 0];
}

charredmesh.Terrain.prototype.getGroundHeight = function(wx, wy) {

	var gx = Math.floor(this.worldToTerrain(wx));
	var gy = Math.floor(this.worldToTerrain(wy));

	var gx1 = gx + 1;
	var gy1 = gy + 1;

	var fracX = (wx - (gx*this.worldUnitsPerDataPoint)) / this.worldUnitsPerDataPoint;
	var fracY = (wy - (gy*this.worldUnitsPerDataPoint)) / this.worldUnitsPerDataPoint;

	var tempHeight1 = this.getTerrainPoint(gx,gy) * (1-fracX) + this.getTerrainPoint(gx1, gy) * (fracX);
	var tempHeight2 = this.getTerrainPoint(gx,gy1) * (1-fracX) + this.getTerrainPoint(gx1, gy1) * (fracX);

	return tempHeight1 * (1-fracY) + tempHeight2 * (fracY);
}

charredmesh.Terrain.prototype.setGroundHeight = function(worldX, worldY, newHeight) {
	var gx = Math.floor(this.worldToTerrain(worldX));
	var gy = Math.floor(this.worldToTerrain(worldY));

  	this.setTerrainPoint(gx, gy, newHeight);
}


charredmesh.Terrain.prototype.setTerrainPoint = function(x, y, newHeight) {
  this.terrainData[x + y * this.terrainDataWidth] = newHeight;
}

charredmesh.Terrain.prototype.getTerrainPoint = function(x, y) {
	return this.terrainData[x + y * this.terrainDataWidth];
}

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = charredmesh.Terrain;
  }
  exports.Terrain = charredmesh.Terrain;
}