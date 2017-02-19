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
            this.out3.disconnect();
            if (v === 'noise') {
                this.out1.connect(this.out3);
                this.out3.connect(this.filter);
                this.out3.onaudioprocess = this.noiseprocess;
            } 
            else if (v === 'pink') {
                this.out1.connect(this.out3);
                this.out3.connect(this.filter);
                this.out3.onaudioprocess = this.pink;
            }
            else if (v === 'brown') {
                this.out1.connect(this.out3);
                this.out3.connect(this.filter);
                this.out3.onaudioprocess = this.brown;
            } 
            else if (v === 'pwm') {
                this.out1.connect(this.filter);
                this.type = "sawtooth";
            } else if (v === 'sawtooth rev') {
                this.out2.connect(this.filter);
                this.setPeriodicWave(this.wave);
            } else {
                this.out2.connect(this.filter);
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

    this.noise = context.createScriptProcessor(4096, 1, 1);

    this.node.noiseprocess = function (audioProcessingEvent) {
        var inputBuffer = audioProcessingEvent.inputBuffer;
        var outputBuffer = audioProcessingEvent.outputBuffer;

        for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
            var inputData = inputBuffer.getChannelData(channel);
            var outputData = outputBuffer.getChannelData(channel);

            for (var sample = 0; sample < inputBuffer.length; sample++) {
                outputData[sample] = Math.random() * 2 - 1;
            }
        }

    };

    this.node.pink =  function(e) {
         var b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < output.length; i++) {
            var white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }
    };

    this.node.brown =  function(e) {
        var lastOut = 0.0;
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < output.length; i++) {
            var white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // (roughly) compensate for gain
        }
    }



    this.node.out1 = this.pulseShaper;
    this.node.out2 = ac.createGain();
    this.node.out2.gain = 1;
    this.node.out3 = noise;
    this.node.connect(this.node.out2);

    this.node.filter = ac.createBiquadFilter();
    this.node.filter.type = 'allpass';
    this.node.out2.connect(this.node.filter);

    this.node.filter.frequency = 1000;

    



    this.node.connect = function () {
        this.filter.connect.apply(this.filter, arguments);
    }.bind(this.node);
    this.node.disconnect = function () {
        this.filter.disconnect.apply(this.filter, arguments);
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