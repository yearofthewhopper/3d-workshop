import { Util } from './utils';
import { THREE } from 'three';

var TerrainLib = function() {
	this.terrainDataWidth = 1024;
	this.terrainDataHeight = 1024;

	this.terrainData 	= new Uint16Array(this.terrainDataWidth * this.terrainDataHeight);
	this.terrainNormals = new Uint8Array(this.terrainDataWidth * this.terrainDataHeight * 3);
	this.terrainHeight  = new Uint8Array(this.terrainDataWidth * this.terrainDataHeight * 3);
	this.terrainHeightScale = 4;
	this.worldUnitsPerDataPoint = 16;
	
	for(var i = 0; i < this.terrainNormals.length; i += 3){
		this.terrainNormals[i+0] = 127;
		this.terrainNormals[i+1] = 255;
		this.terrainNormals[i+2] = 127;

		this.terrainHeight[i] = 0;
	}

	this.BYTE_COUNT = 2;
}

TerrainLib.prototype.loadRGBA = function(data) {
	
	this.terrainData = new Uint16Array(this.terrainDataWidth * this.terrainDataHeight);
	var count = this.terrainDataWidth * this.terrainDataHeight;
	for(var i = 0; i < count; i++) {
		this.terrainData[i] = data[i*4] * this.terrainHeightScale;
	} 

	this.updateNormals();
	this.updateHeight();
}

TerrainLib.prototype.loadBase64Data = function(data) {
	var dataView = Util.decodeBase64(data);
	this.terrainData = new Uint16Array(dataView.buffer);

	this.updateHeight();
	this.updateNormals();
}

TerrainLib.prototype.worldToTerrain = function(worldCoordinate) {
	return worldCoordinate / this.worldUnitsPerDataPoint;
}

TerrainLib.prototype.terrainToWorld = function(terrainCoordinate) {
	return terrainCoordinate * this.worldUnitsPerDataPoint;
}

TerrainLib.prototype.getDataRegion = function(x, y, w, h) {
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
		data : Util.encodeBase64( data.buffer )
	}
}

TerrainLib.prototype.setDataRegion = function(region) {

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

TerrainLib.prototype.updateHeight = function(){
	var count = this.terrainDataWidth * this.terrainDataHeight;
	for(var i = 0; i < count; i++){
		this.terrainHeight[i*3] = Math.floor(this.terrainData[i] / 10);
	}
}

TerrainLib.prototype.updateNormals = function(region) {

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
		rowStep = (this.terrainDataWidth - width) * 3;
	}

	var tmpVecZ = new THREE.Vector3();
	var tmpVecX = new THREE.Vector3();
	var tmpVecNorm = new THREE.Vector3();
	
	var plane = new THREE.Plane();

	var samples = [];
	for(var i = 0; i < 9; i++){
		samples.push(new THREE.Vector3());
	}
	var totals = new THREE.Vector3();

	var norm = new THREE.Vector3();

	for(var y = startY; y < endY; y++) {
		for(var x = startX; x < endX; x++) {

			//var nx = x;
			//var ny = y;

			var sy = (y-1) * this.worldUnitsPerDatPoint;

			samples[0].set( (x-1) * this.worldUnitsPerDataPoint, this.terrainData[ (x-1) + ((y-1) * this.terrainDataWidth) ], (y-1) * this.worldUnitsPerDataPoint );
			samples[1].set(  x    * this.worldUnitsPerDataPoint, this.terrainData[  x    + ((y-1) * this.terrainDataWidth) ], (y-1) * this.worldUnitsPerDataPoint );
			samples[2].set( (x+1) * this.worldUnitsPerDataPoint, this.terrainData[ (x+1) + ((y-1) * this.terrainDataWidth) ], (y-1) * this.worldUnitsPerDataPoint );
			
			samples[3].set( (x-1) * this.worldUnitsPerDataPoint, this.terrainData[ (x-1) + (y * this.terrainDataWidth) ], y * this.worldUnitsPerDataPoint );
			samples[4].set(  x    * this.worldUnitsPerDataPoint, this.terrainData[  x    + (y * this.terrainDataWidth) ], y * this.worldUnitsPerDataPoint );
			samples[5].set( (x+1) * this.worldUnitsPerDataPoint, this.terrainData[ (x+1) + (y * this.terrainDataWidth) ], y * this.worldUnitsPerDataPoint );

			samples[6].set( (x-1) * this.worldUnitsPerDataPoint, this.terrainData[ (x-1) + ((y+1) * this.terrainDataWidth) ], (y+1) * this.worldUnitsPerDataPoint );
			samples[7].set(  x    * this.worldUnitsPerDataPoint, this.terrainData[  x    + ((y+1) * this.terrainDataWidth) ], (y+1) * this.worldUnitsPerDataPoint );
			samples[8].set( (x+1) * this.worldUnitsPerDataPoint, this.terrainData[ (x+1) + ((y+1) * this.terrainDataWidth) ], (y+1) * this.worldUnitsPerDataPoint );

			
			totals.set(0,0,0);			
			
			plane.setFromCoplanarPoints(samples[0], samples[1], samples[4]);
			totals.add(plane.normal.negate());

			plane.setFromCoplanarPoints(samples[1], samples[2], samples[4]);
			totals.add(plane.normal.negate());

			plane.setFromCoplanarPoints(samples[2], samples[5], samples[4]);
			totals.add(plane.normal.negate());

			plane.setFromCoplanarPoints(samples[5], samples[8], samples[4]);
			totals.add(plane.normal.negate());

			plane.setFromCoplanarPoints(samples[8], samples[7], samples[4]);
			totals.add(plane.normal.negate());

			plane.setFromCoplanarPoints(samples[7], samples[6], samples[4]);
			totals.add(plane.normal.negate());

			plane.setFromCoplanarPoints(samples[6], samples[3], samples[4]);
			totals.add(plane.normal.negate());

			plane.setFromCoplanarPoints(samples[3], samples[0], samples[4]);
			totals.add(plane.normal.negate());

			
			totals.multiplyScalar(0.125);

			this.terrainNormals[idx] = Math.floor(totals.x * 128 + 127);
			this.terrainNormals[idx+1] = Math.floor(totals.y * 128 + 127);
			this.terrainNormals[idx+2] = Math.floor(totals.z * 128 + 127);




			/*
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

				tmpVecX.set(1, dx, 0);
				tmpVecZ.set(0, dy, 1);

				tmpVecX.normalize();
				tmpVecZ.normalize();

				tmpVecNorm = tmpVecX.cross(tmpVecZ);
				tmpVecNorm.normalize();

				this.terrainNormals[idx] = Math.floor(tmpVecNorm.x * 128 + 128);
				this.terrainNormals[idx+1] = Math.floor(tmpVecNorm.y * 128 + 128);
				this.terrainNormals[idx+2] = Math.floor(tmpVecNorm.z * 128 + 128);
			} else {
				this.terrainNormals[idx] = 127;
				this.terrainNormals[idx+1] = 127;
				this.terrainNormals[idx+2] = 255;
			}

			if( x == 50){
				//console.log(samp1.toArray(),this.terrainNormals[idx], this.terrainNormals[idx+1], this.terrainNormals[idx+2]);
			}

			*/
			idx += 3;
			
		}

		// skip furthest right and left-most columns
		idx += rowStep;
	}
  
	//normalDataTexture.needsUpdate = true
}

TerrainLib.prototype.getGroundNormal = function(worldX, worldY) {

	var gx = Math.floor(this.worldToTerrain(worldX));
	var gy = Math.floor(this.worldToTerrain(worldY));

	var gx1 = gx + 1;
	var gy1 = gy + 1;

	var fracX = (worldX - (gx * this.worldUnitsPerDataPoint)) / this.worldUnitsPerDataPoint;
	var fracY = (worldY - (gy * this.worldUnitsPerDataPoint)) / this.worldUnitsPerDataPoint;

	var tempNormal1 = this.getTerrainNormal(gx, gy);
	tempNormal1.multiplyScalar(1-fracX);
	tempNormal1.add( this.getTerrainNormal(gx1, gy).multiplyScalar(fracX) );

	var tempNormal2 = this.getTerrainNormal(gx, gy1);
	tempNormal2.multiplyScalar(1-fracX);
	tempNormal2.add( this.getTerrainNormal(gx1, gy1).multiplyScalar(fracX) );

	tempNormal1.multiplyScalar(1-fracY);
	tempNormal2.multiplyScalar(fracY);

	/*tempNormal1[0] *= (1-fracY);
	tempNormal1[1] *= (1-fracY);
	tempNormal1[2] *= (1-fracY);

	tempNormal2[0] *= fracY;
	tempNormal2[1] *= fracY;
	tempNormal2[2] *= fracY;*/
//	console.log(fracX, fracY, this.getTerrainNormal(gx, gy1).toArray(), tempNormal1.toArray(), tempNormal2.toArray());
	return tempNormal1.add(tempNormal2);
}

TerrainLib.prototype.getGroundHeight = function(wx, wy) {

	var gx = Math.floor(this.worldToTerrain(wx));
	var gy = Math.floor(this.worldToTerrain(wy));

	var gx1 = gx + 1;
	var gy1 = gy + 1;

	var fracX = (wx - (gx*this.worldUnitsPerDataPoint)) / this.worldUnitsPerDataPoint;
	var fracY = (wy - (gy*this.worldUnitsPerDataPoint)) / this.worldUnitsPerDataPoint;

	var tempHeight1 = this.getTerrainPoint(gx,gy) * (1-fracX) + this.getTerrainPoint(gx1, gy) * (fracX);
	var tempHeight2 = this.getTerrainPoint(gx,gy1) * (1-fracX) + this.getTerrainPoint(gx1, gy1) * (fracX);

	return tempHeight1 * (1-fracY) + tempHeight2 * fracY;
}

TerrainLib.prototype.setGroundHeight = function(worldX, worldY, newHeight) {
	var gx = Math.floor(this.worldToTerrain(worldX));
	var gy = Math.floor(this.worldToTerrain(worldY));

  	this.setTerrainPoint(gx, gy, newHeight);
}

TerrainLib.prototype.getTerrainNormal = function(x, y){
	var idx = (x + y * this.terrainDataWidth) * 3;
	var vec = new THREE.Vector3( (this.terrainNormals[idx] - 127) / 128, (this.terrainNormals[idx+1] - 127) / 128, (this.terrainNormals[idx+2] - 127) / 128);
	return vec.normalize();
}

TerrainLib.prototype.setTerrainPoint = function(x, y, newHeight) {
  this.terrainData[x + y * this.terrainDataWidth] = newHeight;
}

TerrainLib.prototype.getTerrainPoint = function(x, y) {
	return this.terrainData[x + y * this.terrainDataWidth];
}

export default = TerrainLib;
