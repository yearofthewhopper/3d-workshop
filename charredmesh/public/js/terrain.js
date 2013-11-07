var charredmesh = charredmesh || {};

charredmesh.Terrain = function(util) {
	this.Util = util;
	this.terrainDataWidth = 1024;
	this.terrainDataHeight = 1024;

	this.terrainData = null;

	this.terrainHeightScale = 1.5;
	this.worldUnitsPerDataPoint = 16;

	this.BYTE_COUNT = 2;
}

charredmesh.Terrain.prototype.loadRGBA = function(data) {
	
	//this.terrainData = [];
	this.terrainData = new Uint16Array(this.terrainDataWidth * this.terrainDataHeight);
	var count = this.terrainDataWidth * this.terrainDataHeight;
	for(var i = 0; i < count; i++) {
		this.terrainData[i] = data[i*4];
	} 
}

charredmesh.Terrain.prototype.loadBase64Data = function(data) {
	var dataView = Util.decodeBase64(data);
	this.terrainData = new Uint16Array(dataView.buffer);
}

charredmesh.Terrain.prototype.worldToTerrain = function(worldCoordinate) {
	return worldCoordinate / this.worldUnitsPerDataPoint;
}

charredmesh.Terrain.prototype.terrainToWorld = function(terrainCoordinate) {
	return terrainCoordinate * this.worldUnitsPerDataPoint;
}

charredmesh.Terrain.prototype.getDataRegion = function(x, y, w, h) {
	var dataX = x;
	var dataY = y;
	var dataW = (w+x) <= this.terrainDataWidth ? w : this.terrainDataWidth - x;
	var dataH = (h+y) <= this.terrainDataHeight ? h : this.terrainDataHeight - y;

	var data = new Uint16Array(dataW * dataH);
	
	for(var dy = 0; dy < dataH; dy++){
		for(var dx = 0; dx < dataW; dx++){
			data[dx+dy*dataW] = this.terrainData[(dx+dataX)+(dy+dataY)*this.terrainDataWidth];
		}
	}

	return {
		x : dataX,
		y : dataY,
		w : dataW,
		h : dataH,
		data : this.Util.encodeBase64( data.buffer )
	}
}

charredmesh.Terrain.prototype.setDataRegion = function(region) {

	var dataX = region.x;
	var dataY = region.y;
	var dataW = (region.w+region.x) <= this.terrainDataWidth ? region.w : this.terrainDataWidth - region.x;
	var dataH = (region.h+region.y) <= this.terrainDataHeight ? region.h : this.terrainDataHeight - region.y;
	var dataOffset = dataX + dataY * this.terrainDataWidth;

	var tmp = new Uint16Array(Util.decodeBase64(region.data).buffer);

	for(var dy = 0; dy < dataH; dy++){
		for(var dx = 0; dx < dataW; dx++){
			this.terrainData[(dx+dataX) + (dy+dataY) * this.terrainDataWidth] = tmp[dx+dy*dataW];
		}
	}
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