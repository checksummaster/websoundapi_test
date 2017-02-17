//Pre-calculate the WaveShaper curves so that we can reuse them.
var pulseCurve = new Float32Array(256);
for (var i = 0; i < 128; i++) {
    pulseCurve[i] = -1;
    pulseCurve[i + 128] = 1;
}
var constantOneCurve = new Float32Array(2);
constantOneCurve[0] = 1;
constantOneCurve[1] = 1;

//Add a new factory method to the AudioContext object.
var createOscillatorExt = function (ac) {
    //Use a normal oscillator as the basis of our new oscillator.
    this.node = ac.createOscillator();
    this.node.type = "sine";

    
    var numCoeffs = 128; // The more coefficients you use, the better the approximation
    var realCoeffs = new Float32Array(numCoeffs);
    var imagCoeffs = new Float32Array(numCoeffs);

    realCoeffs[0] = 0.5;
    for (var i = 1; i < numCoeffs; i++) { // note i starts at 1
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


    //Shape the output into a pulse wave.
    this.pulseShaper = ac.createWaveShaper();
    this.pulseShaper.curve = pulseCurve;
    this.node.connect(this.pulseShaper);

    //Use a GainNode as our new "width" audio parameter.
    this.widthGain = ac.createGain();
    this.widthGain.gain.value = 0; //Default width.
    this.node.width = this.widthGain.gain; //Add parameter to oscillator node.
    this.widthGain.connect(this.pulseShaper);

    //Pass a constant value of 1 into the widthGain – so the "width" setting
    //is duplicated to its output.
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


    this.osc = createOscillatorExt(ac); 
    this.osc.width.value = 0;
    this.osc.env = ac.createGain();


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

    this.osc.out = ac.createGain();
    this.osc.out.gain = 1;


    var chain = [this.osc,this.osc.env,this.osc.tremoloout];
    var node = chain[0];
    for (i = 1; i < chain.length ; i ++) {
        node.connect(chain[i]);
        node = chain[i];
    }

    this.osc.connect2 = function () {
        this.tremoloout.connect.apply(this.tremoloout, arguments);
    }.bind(this.osc);
    this.osc.disconnect2 = function () {
        this.tremoloout.disconnect.apply(this.tremoloout, arguments);
    }.bind(this.osc);

    this.osc.start(0);
    this.osc.vibrato.start(0);
    this.osc.tremolo.start(0);



    return this.osc;
}