var audioContext;
var pendingFiles = 0;

var sounds = {
	"motor" : {
		"path" : "/audio/motor.mp3",
		"loop" : true,
		"loopTime" : [0.1, 1.1],
		"rolloff" : 0.75
	},
	"tracks" : {
		"path" : "/audio/tracks.mp3",
		"loop" : true,
		//"loopTime" : [0.1, 1.1],
		"rolloff" : 1.15
	},
	"rotate" : {
		"path" : "/audio/rotate.mp3",
		"loop" : true,
		"loopTime" : [0.2, 1.6],
		"rolloff" : 1
	},
	"fire" : {
		"path" : "/audio/fire.mp3",
		"loop" : false,
		"rolloff" : 0.7,
		"gain" : 0.5,
		"pitchSpread" : [0.90, 1.05]
	},
	"explosion" : {
		"path" : "/audio/explosion.mp3",
		"loop" : false,
		"rolloff" : 0.32,
		"gain" : 1.25,
		"pitchSpread" : [0.90, 1.05]	
	},
	"splash" : {
		"path" : "/audio/splash.mp3",
		"loop" : false,
		"rolloff" : 4,
		"pitchSpread" : [0.85, 1.1]
	},
	"dirt" : {
		"path" : "/audio/dirt-hit.mp3",
		"loop" : false,
		"rolloff" : 4,
		"pitchSpread" : [0.80, 1.0]
	}
};


var globalGain;
var loaded = false;
var enabled = true;


function playSound(buffer, gain) {
 if(!loaded || !enabled){
   return;
  }

  var source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.gain.value = gain || 1;
  source.connect(globalGain);
  source.noteOn(0);
}

function loadBuffer(url, name, callback){
	var request = new XMLHttpRequest();

	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	request.onload = function() {
		audioContext.decodeAudioData(request.response, function(buffer){
			callback(buffer, name);
		});
	};

	request.send();
}

function init(onReady) {
	if ('undefined' === typeof webkitAudioContext) {
		enabled = false;
		return;
	}

	// get the audio context
	audioContext = new webkitAudioContext();
	
	globalGain = audioContext.createGainNode();
	globalGain.connect(audioContext.destination);

	for(var itm in sounds){
		if(sounds.hasOwnProperty(itm)){
			
			pendingFiles++;

			loadBuffer(sounds[itm].path, itm, function(buff, name) {
				sounds[name].buffer = buff;

				pendingFiles--;
				if(pendingFiles <= 0){
					console.log(sounds);
					onReady();
				}
			});
		}
	}
	
	//globalGain.gain.value = 0;
}

export default = {

	initialize : function(onReady){
		init(onReady);
		loaded = true;
	},

	getSound : function(sound){
		if(sounds[sound]){
			var source = audioContext.createBufferSource();
			
			source.buffer = sounds[sound].buffer;
			//source.gain.value = 0.5;
			
			source.loop = sounds[sound].loop;

			source.panner = audioContext.createPanner();
			source.panner.refDistance = 250;
			source.connect(source.panner)
			source.panner.connect(globalGain);

			if(sounds[sound].loopTime) {
				source.loopStart = sounds[sound].loopTime[0];
				source.loopEnd = sounds[sound].loopTime[1];
			}

			if(sounds[sound].rolloff){
				//source.panner.maxDistance = sounds[sound].range;
				source.panner.rolloffFactor = sounds[sound].rolloff;
			}

			source.noteOn(0);

			return source;
		}
	},

	playSound : function(sound, position){
		if(sounds[sound]){
			var source = audioContext.createBufferSource();
			source.panner = audioContext.createPanner();
			if(sounds[sound].rolloff){
				//source.panner.maxDistance = sounds[sound].range;
				source.panner.rolloffFactor = sounds[sound].rolloff;
			}
			source.connect(source.panner)

			source.buffer = sounds[sound].buffer;
			
			if(sounds[sound].gain){
				source.gain.value = sounds[sound].gain;
			}

			source.panner.refDistance = 250;
			source.panner.connect(globalGain);
			//var scl = 0.001;
			source.panner.setPosition(position.x, position.y, position.z);
			//source.panner.setPosition(0,0,0);
			//console.log(position.toArray());

			/*source.loop = sounds[sound].loop;

			if(sounds[sound].loopTime) {
				source.loopStart = sounds[sound].loopTime[0];
				source.loopEnd = sounds[sound].loopTime[1];
			}*/

			if(sounds[sound].pitchSpread){
				source.playbackRate.value = Math.random() * (sounds[sound].pitchSpread[1] - sounds[sound].pitchSpread[0]) + sounds[sound].pitchSpread[0];
			}

			source.noteOn(0);

			return source;
		}
	},

	setListenerPosition : function(position, direction){
		//var scl = 0.001;
		audioContext.listener.setPosition(position.x, position.y, position.z);
		audioContext.listener.setOrientation(direction.x, direction.y, direction.z, 0, 1, 0);
	},

	setMute : function(mute) {
		if (enabled) {
			globalGain.gain.value = mute ? 0 : 1;
		}
	}
}
