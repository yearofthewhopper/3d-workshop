var charredmesh = charredmesh || {};

charredmesh.Terrain = function(util, three) {
	this.Util = util;
	this.THREE = three;
	this.terrainDataWidth = 1024;
	this.terrainDataHeight = 1024;

	this.terrainData 	= new Uint16Array(this.terrainDataWidth * this.terrainDataHeight);
	this.terrainNormals = new Uint8Array(this.terrainDataWidth * this.terrainDataHeight * 3);
	this.terrainHeight  = new Uint8Array(this.terrainDataWidth * this.terrainDataHeight * 3);
	this.terrainHeightScale = 5;
	this.worldUnitsPerDataPoint = 16;

	this.BYTE_COUNT = 2;
}

charredmesh.Terrain.prototype.loadRGBA = function(data) {
	
	this.terrainData = new Uint16Array(this.terrainDataWidth * this.terrainDataHeight);
	var count = this.terrainDataWidth * this.terrainDataHeight;
	for(var i = 0; i < count; i++) {
		this.terrainData[i] = data[i*4] * this.terrainHeightScale;
	} 

	this.updateNormals();
	this.updateHeight();
}

charredmesh.Terrain.prototype.loadBase64Data = function(data) {
	var dataView = Util.decodeBase64(data);
	this.terrainData = new Uint16Array(dataView.buffer);

	this.updateHeight();
	this.updateNormals();
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

	this.updateNormals(region);
	this.updateHeight();
}

charredmesh.Terrain.prototype.updateHeight = function(){
	var count = this.terrainDataWidth * this.terrainDataHeight;
	for(var i = 0; i < count; i++){
		this.terrainHeight[i*3] = Math.floor(this.terrainData[i] / 10);
	}
}

charredmesh.Terrain.prototype.updateNormals = function(region) {
	
	var idx = 0;
	var dx = 0; 
	var dy = 0;
	var sobelTaps = [];
	var valueRange = 64;
	var valueHalf = valueRange / 2;

	var startX = 1;
	var startY = 1;
	var endX = this.terrainDataWidth - 1;
	var endY = this.terrainDataHeight - 1;
	var rowStep = 6; // two pixels

	if(region != null){
		startX = region.x;
		startY = region.y;
		endX = region.x + region.w;
		endY = region.y + region.h;
		idx = (startX + startY * this.terrainDataWidth) * 3;
		var width = endX - startX;
		// todo: calculate row step.
		rowStep = (this.terrainDataWidth - width) * 3;
		console.log(region);
	}

	var tmpVecZ = new this.THREE.Vector3();
	var tmpVecX = new this.THREE.Vector3();
	var tmpVecNorm = new this.THREE.Vector3();

	for(var y = startY; y < endY; y++) {
		for(var x = startX; x < endX; x++) {


			var nx = x;
			var ny = y;
			// Get sobel samples
			sobelTaps[0] = this.terrainData[ (nx - 1 + (ny - 1) * this.terrainDataWidth) ];
			sobelTaps[1] = this.terrainData[ (nx + (ny - 1) * this.terrainDataWidth) ];
			sobelTaps[2] = this.terrainData[ (nx + 1 + (ny - 1) * this.terrainDataWidth) ];

			sobelTaps[3] = this.terrainData[ (nx - 1 + (ny + 1) * this.terrainDataWidth) ];
			sobelTaps[4] = this.terrainData[ (nx  + (ny + 1) * this.terrainDataWidth) ];
			sobelTaps[5] = this.terrainData[ (nx + 1 + (ny + 1) * this.terrainDataWidth) ];

			sobelTaps[6] = this.terrainData[ (nx - 1 + ny * this.terrainDataWidth) ];
			sobelTaps[7] = this.terrainData[ (nx + 1 + ny * this.terrainDataWidth) ];

			// Do y sobel filter
			dy  = sobelTaps[0] * 1;
			dy += sobelTaps[1] * 2;
			dy += sobelTaps[2] * 1;

			dy += sobelTaps[3] * -1;
			dy += sobelTaps[4] * -2;
			dy += sobelTaps[5] * -1;

			// Do x sobel filter
			dx  = sobelTaps[0] * -1;
			dx += sobelTaps[6] * -2;
			dx += sobelTaps[3] * -1;

			dx += sobelTaps[2] * +1;
			dx += sobelTaps[7] * +2;
			dx += sobelTaps[5] * +1;

			dx = (dx / valueRange);
			dy = (dy / valueRange);

			if((dx != 0) || (dy != 0)){

				tmpVecX.set(1, 0, dx);
				tmpVecZ.set(0, 1, dy);

				tmpVecX.normalize();
				tmpVecZ.normalize();

				tmpVecNorm = tmpVecX.cross(tmpVecZ);
				tmpVecNorm.normalize();

				this.terrainNormals[idx] = Math.floor(tmpVecNorm.x * 128 + 128);
				this.terrainNormals[idx+1] = Math.floor(tmpVecNorm.z * 128 + 128);
				this.terrainNormals[idx+2] = Math.floor(tmpVecNorm.y * 128 + 128);
			} else {
				this.terrainNormals[idx] = 127;
				this.terrainNormals[idx+1] = 255;
				this.terrainNormals[idx+2] = 127;
			}

			idx += 3;
			
		}

		// skip furthest right and left-most columns
		idx += rowStep;
	}
  
	//normalDataTexture.needsUpdate = true
}

charredmesh.Terrain.prototype.getGroundNormal = function(worldX, worldY) {
	var gx = Math.floor(this.worldToTerrain(worldX));
	var gy = Math.floor(this.worldToTerrain(worldY));
	// todo: implement this.
	var idx = gx + gy * this.terrainDataWidth;
	return [idx, idx+1, idx+2];
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