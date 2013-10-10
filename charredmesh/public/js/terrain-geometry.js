/**
 * @author mrdoob / http://mrdoob.com/
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

THREE.TerrainGeometry = function ( resolution, chunkSize, terrainScale, chunkData ) {

	THREE.Geometry.call( this );

	this.width = chunkSize * terrainScale;
	this.height = chunkSize * terrainScale;

	this.widthSegments = Math.floor(chunkSize / resolution);
	this.heightSegments = Math.floor(chunkSize / resolution);

	var ix, iz;
	var width_half = this.width / 2;
	var height_half = this.height / 2;

	var gridX = this.widthSegments;
	var gridZ = this.heightSegments;

	var gridX1 = gridX + 1;
	var gridZ1 = gridZ + 1;

	var segment_width = this.width / gridX;
	var segment_height = this.height / gridZ;

	var normal = new THREE.Vector3( 0, 0, 1 );
	
	var dataRowLength = chunkSize+1;
	
	var vz = 0;
	var vx = 0;

	var sx = 0
	var skirtIndeces = [];

	var get = function(x,y){
		return chunkData[x*resolution+y*resolution*dataRowLength];
	}

	skirtIndeces.push(this.vertices.length);
	this.vertices.push( new THREE.Vector3( sx, get(0, 0), 0 ) );
	for ( ix = 0; ix < gridX1; ix ++ ) {
		// top skirt row.
		//left skirt vertex
		sx = ix * segment_width;
		skirtIndeces.push(this.vertices.length);
		this.vertices.push( new THREE.Vector3( sx, get(ix, 0), 0 ) );
	}
	skirtIndeces.push(this.vertices.length);
	this.vertices.push( new THREE.Vector3( sx, get(ix, 0), 0 ) );

	for ( iz = 0; iz < gridZ1; iz ++ ) {
		vz = iz * segment_height;

		//left skirt vertex
		skirtIndeces.push(this.vertices.length);
		this.vertices.push( new THREE.Vector3( 0, get(0, iz), vz ) );

		for ( ix = 0; ix < gridX1; ix ++ ) {

			vx = ix * segment_width;

			//var y = chunkData[ix*resolution + iz*resolution * dataRowLength];

			this.vertices.push( new THREE.Vector3( vx, get(ix, iz), vz ) );
		}

		//right skirt vertex
		skirtIndeces.push(this.vertices.length);
		this.vertices.push( new THREE.Vector3( vx, get(ix, iz), vz ) );
	}

	sx = 0;
	skirtIndeces.push(this.vertices.length);
	this.vertices.push( new THREE.Vector3( sx, get(0, iz), vz ) );
	for ( ix = 0; ix < gridX1; ix ++ ) {
		// bottom skirt row.
		sx = ix * segment_width;
		skirtIndeces.push(this.vertices.length);
		this.vertices.push( new THREE.Vector3( sx, get(ix, iz), vz ) );
	}
	skirtIndeces.push(this.vertices.length);
	this.vertices.push( new THREE.Vector3( sx, get(ix, iz), vz ) );

	gridZ += 2;
	gridX += 2;
	gridX1 += 2;
	gridZ1 += 2;

	//console.log("Chunk vertices: " + this.vertices.length + ", last x:" + lx);
	for ( iz = 0; iz < gridZ; iz ++ ) {

		for ( ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iz;
			var b = ix + gridX1 * ( iz + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
			var d = ( ix + 1 ) + gridX1 * iz;

			var uva = new THREE.Vector2( ix / gridX, 1 - iz / gridZ );
			var uvb = new THREE.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ );
			var uvc = new THREE.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ );
			var uvd = new THREE.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ );

			var face = new THREE.Face3( a, b, d );
			face.normal.copy( normal );
			face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );

			this.faces.push( face );
			this.faceVertexUvs[ 0 ].push( [ uva, uvb, uvd ] );

			face = new THREE.Face3( b, c, d );
			face.normal.copy( normal );
			face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );

			this.faces.push( face );
			this.faceVertexUvs[ 0 ].push( [ uvb.clone(), uvc, uvd.clone() ] );

		}

	}

	//this.computeCentroids();
	this.computeFaceNormals();
    this.computeVertexNormals();

    for(var i = 0; i < skirtIndeces.length; i++){
    	//this.vertices[ skirtIndeces[i] ].y = 0;
    }

};

THREE.TerrainGeometry.prototype.updateTerrainNormals = function(){
	// TODO: update normals?  Or try to do all of this in the shader?
}

THREE.TerrainGeometry.prototype = Object.create( THREE.Geometry.prototype );