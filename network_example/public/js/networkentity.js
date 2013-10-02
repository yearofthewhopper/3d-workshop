var THREE 	= THREE ? THREE : require("three");

var Snockets = Snockets || { REVISION: '0.0.0' };

Snockets.SERVER = 1;
Snockets.CLIENT = 2;

Snockets.Message = {
	"UPDATE" : "u"
};

Snockets.CONTEXT = Snockets.SERVER;


Snockets.Entity = function(id) {

	this.id = (id) ? id : Snockets.Entity.UID_COUNTER++;

	this.position = new THREE.Vector3(0,0,0);
	this.velocity = new THREE.Vector3(0,0,0);
	this.rotation = new THREE.Vector3(0,0,0);
	
	this._tmpVec  = new THREE.Vector3(0,0,0);
	
	this.life 		= 2;
	this.obj 		= null;
	this.alive 		= true;
	this.material 	= null;
	this.color 		= 0x000000;
	this.talked 	= false;
	this.messages 	= [];

	return this;
};

Snockets.Entity.prototype = {

	serverTick : function(delta) {
		this.tick(delta);
		
		this.life -= delta;
		if(this.life <= 0){
			this.alive = false;
		}

		if((this.life < 0.5) && !this.talked){
			this.talked = true;
			this.postMessage("foo", "trundle");
		}
	},

	tick : function(delta) {
		this._tmpVec.copy(this.velocity);
		this._tmpVec.multiplyScalar(delta);
		this.position.add(this._tmpVec);
	},

	serialize : function() {
		var values = [this.position.x, this.position.y, this.position.z, this.rotation.x, this.rotation.y, this.rotation.z, this.velocity.x, this.velocity.y, this.velocity.z, this.color];

		return values;
	},

	deserialize : function(obj) {
		this.color = obj[9];
		this.position.set(obj[0], obj[1], obj[2]);
		this.rotation.set(obj[3], obj[4], obj[5]);
		this.velocity.set(obj[6], obj[7], obj[8]);
	},

	createObj : function() {
		this.material = new THREE.MeshLambertMaterial({
    		color: this.color
  		});

		var geom = new THREE.CubeGeometry(20, 20, 20);
  		
  		this.obj = new THREE.Mesh(geom, this.material);

		return this.obj;
	},

	updateObj : function() {
		this.obj.position.copy(this.position);
		this.obj.rotation.copy(this.rotation);
	},

	postMessage : function(message, data){
		this.messages.push({message : data});
	},

	dispatchMessage : function(message, data){
		switch(message){
			case "foo":
				console.log(this.id + " says " + data + "!");
			break;
		}
	}
}

Snockets.Entity.prototype.decodeFloat32 = (function() {
	var arr  = new Float32Array( 1 );
	var char = new Uint8Array( arr.buffer );
	return function( str, offset, obj, propName ) {
		// Again, pay attention to endianness
		// here in production code.
		for ( var i = 0; i < 4; ++i ) {
			char[i] = str.charCodeAt( offset + i );
		}

		obj[ propName ] = arr[0];

		// Number of bytes (characters) read.
		return 4;
	};
}());

Snockets.Entity.prototype.encodeFloat32 = (function() {
		
	var arr  = new Float32Array( 1 );
	var char = new Uint8Array( arr.buffer );

	return function( number ) {
		arr[0] = number;
		// In production code, please pay
		// attention to endianness here.
		return String.fromCharCode( char[0], char[1], char[2], char[3] );
		};
}());

Snockets.Entity.prototype.decodeUint8 =  function( str, offset, obj, propName ) {
  obj[ propName ] = str.charCodeAt( offset );
 
  // Number of bytes (characters) read.
  return 1;
};

Snockets.Entity.prototype.encodeUint8 = (function() {
  var arr = new Uint8Array( 1 );
  return function( number ) {
    // If we assume that the number passed in
    // valid, we can just use it directly.
    // return String.fromCharCode( number );
    arr[0] = number;
    return String.fromCharCode( arr[0] );
  };
}());

Snockets.Entity.UID_COUNTER = 0;

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Snockets;
  }
  exports.Snockets = Snockets;
} else {
  this['Snockets'] = Snockets;
}