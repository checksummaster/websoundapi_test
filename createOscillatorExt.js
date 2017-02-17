var pulseCurve = new Float32Array(256);
for (var i = 0; i < 128; i++) {
    pulseCurve[i] = -1;
    pulseCurve[i + 128] = 1;
}
var constantOneCurve = new Float32Array(2);
constantOneCurve[0] = 1;
constantOneCurve[1] = 1;


var createOscillatorExt = function (ac) {

    this.node = ac.createOscillator();
    this.node.type = "sine";


    var numCoeffs = 128; 
    var realCoeffs = new Float32Array(numCoeffs);
    var imagCoeffs = new Float32Array(numCoeffs);

    realCoeffs[0] = 0.5;
    for (var i = 1; i < numCoeffs; i++) {
        imagCoeffs[i] = 1 / (i * Math.PI);
    }

    this.node.wave = context.createPeriodicWave(realCoeffs, imagCoeffs);

    Object.defineProperty(this.node, 'typeext', {
        set: function (v) {
            this.out1.disconnect();
            this.out2.disconnect();
            if (v === 'pwm') {
                this.out1.connect(this.out);
                this.type = "sawtooth";
            } else if (v === 'sawtooth rev') {
                this.out2.connect(this.out);
                this.setPeriodicWave(this.wave);
            } else {
                this.out2.connect(this.out);
                this.type = v;
            }
        }.bind(this.node)
    });


    this.pulseShaper = ac.createWaveShaper();
    this.pulseShaper.curve = pulseCurve;
    this.node.connect(this.pulseShaper);

    this.widthGain = ac.createGain();
    this.widthGain.gain.value = 0; 
    this.node.width = this.widthGain.gain; 
    this.widthGain.connect(this.pulseShaper);

    this.constantOneShaper = ac.createWaveShaper();
    this.constantOneShaper.curve = constantOneCurve;
    this.node.connect(constantOneShaper);
    this.constantOneShaper.connect(widthGain);

    this.node.out1 = this.pulseShaper;
    this.node.out2 = ac.createGain();
    this.node.out2.gain = 1;
    this.node.connect(this.node.out2);

    this.node.out = ac.createGain();
    this.node.out.gain = 1;
    this.node.out2.connect(this.node.out);


    this.node.connect = function () {
        this.out.connect.apply(this.out, arguments);
    }.bind(this.node);
    this.node.disconnect = function () {
        this.out.disconnect.apply(this.out, arguments);
    }.bind(this.node);

    return this.node;
}

var createOscillatorExt2 = function (ac) {

    this.ac = ac;
    this.osc = createOscillatorExt(ac);
    this.osc.width.value = 0;
    this.osc.env = ac.createGain();
    this.osc.env.gain = 1;

    this.osc.vibrato = createOscillatorExt(ac);
    this.osc.vibratogain = ac.createGain();
    this.osc.vibrato.frequency.value = 4;
    this.osc.vibratogain.gain.value = 0;
    this.osc.vibrato.connect(this.osc.vibratogain);
    this.osc.vibratogain.connect(this.osc.frequency);

    this.osc.tremolo = createOscillatorExt(ac);
    this.osc.tremologain = ac.createGain();
    this.osc.tremoloout = ac.createGain();
    this.osc.tremolo.frequency.value = 4;
    this.osc.tremologain.gain.value = 0;
    this.osc.tremolo.connect(this.osc.tremologain);
    this.osc.tremologain.connect(osc.tremoloout.gain);


    var chain = [this.osc, this.osc.env, this.osc.tremoloout];
    var node = chain[0];
    for (i = 1; i < chain.length; i++) {
        node.connect(chain[i]);
        node = chain[i];
    }


    var chain = [this.osc, this.osc.env, this.osc.tremoloout];
    var node = chain[0];
    for (i = 1; i < chain.length; i++) {
        node.connect(chain[i]);
        node = chain[i];
    }

    this.osc.connect = function () {
        this.tremoloout.connect.apply(this.tremoloout, arguments);
    }.bind(this.osc);
    this.osc.disconnect = function () {
        this.tremoloout.disconnect.apply(this.tremoloout, arguments);
    }.bind(this.osc);

    this.osc.PulseEnable = function(val){
        if (val) {
            this.env.gain.value = 0;
        } else {
            var now = this.context.currentTime;
            this.env.gain.cancelScheduledValues(now);
            this.env.gain.value = 1; 
        }
    }.bind(this.osc);

    this.osc.Pulse = function () {
        if (document.getElementById('Envelope').checked) {
            
            var attack = parseFloat(document.getElementById('attack').value);
            var decay = parseFloat(document.getElementById('decay').value);
            var subtain = parseFloat(document.getElementById('subtain').value);
            var release = parseFloat(document.getElementById('release').value);
            var maxenvelop = parseFloat(document.getElementById('maxenvelop').value);;
            var volumeenvelop = parseFloat(document.getElementById('volumeenvelop').value);;

            var now = this.context.currentTime;

            if (true) {
                this.env.gain.cancelScheduledValues(now);
                this.env.gain.setTargetAtTime(0, context.currentTime, 0.015);
                this.env.gain.linearRampToValueAtTime(maxenvelop, now + attack);
                this.env.gain.linearRampToValueAtTime(volumeenvelop, now + attack + decay);
                this.env.gain.linearRampToValueAtTime(volumeenvelop, now + attack + decay + subtain);
                this.env.gain.linearRampToValueAtTime(0, now + attack + decay + subtain + release);
            } else {
                this.env.gain.cancelScheduledValues(now);
                this.env.gain.setTargetAtTime(0.0001, context.currentTime, 0.015);
                this.env.gain.exponentialRampToValueAtTime(maxenvelop, now + attack);
                this.env.gain.exponentialRampToValueAtTime(volumeenvelop, now + attack + decay);
                this.env.gain.exponentialRampToValueAtTime(volumeenvelop, now + attack + decay + subtain);
                this.env.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay + subtain + release);
            }
        } else {
            this.env.gain.value = 1;
        }
    }.bind(this.osc);

    this.osc.start(0);
    this.osc.vibrato.start(0);
    this.osc.tremolo.start(0);
    

    return this.osc;
}