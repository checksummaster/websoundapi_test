var osc,context,scope1,scope2,freq

function start()
{
    context = new(window.AudioContext || window.webkitAudioContext)();
    scope1 = new Scope(document.getElementById('scope'), {
        timediv: 0.5,
        width: 512,
        height: 256
    });
    scope2 = new Scope(document.getElementById('scope2'), {
        timediv: 0.01,
        master: scope1,
        width: 512,
        height: 256
    });
    
    freq = new Freq(document.getElementById('freq'), {
        width: 512,
        height: 256
    });
    
    osc = createOscillatorExt2(context);
    
    var chain = [osc, scope1.scriptNode, freq.analyser, context.destination];
    var node = chain[0];
    for (i = 1; i < chain.length; i++) {
        node.connect(chain[i]);
        node = chain[i];
    }
}



var Scope = function (canvas, cfg) {

    if (cfg === undefined) {
        cfg = {};
    }

    this.input = this.scriptNode;
    this.output = this.scriptNode;

    this.width = cfg.width || canvas.width;
    this.height = cfg.height || canvas.height;
    this.timediv = cfg.timediv || 0.001;

    canvas.width = this.width;
    canvas.height = this.height;

    this.drawContextScope = canvas.getContext('2d');

    this.continuedraw = 0;

    this.draw = function (times) {


        var deltax = 0; //0.0005;       

        var scaling = this.height / 2;
        var risingEdge = 0;


        var pixeltime = 1.0 / context.sampleRate;
        var naturaltimediv = pixeltime * this.width / 10;

        var xratio = naturaltimediv / this.timediv;


        if (this.continuedraw == 0) {

            // No buffer overrun protection
            if (this.neg) {
                while (times[risingEdge++] < this.edgeThreshold && risingEdge < times.length);
                if (risingEdge >= times.length) risingEdge = 0;

                while (times[risingEdge++] > this.edgeThreshold && risingEdge < times.length);
                if (risingEdge >= times.length) risingEdge = 0;


            } else {
                while (times[risingEdge++] > this.edgeThreshold && risingEdge < times.length);
                if (risingEdge >= times.length) risingEdge = 0;

                while (times[risingEdge++] < this.edgeThreshold && risingEdge < times.length);
                if (risingEdge >= times.length) risingEdge = 0;
            }


            this.drawContextScope.fillStyle = 'rgb(0, 20, 0)';
            this.drawContextScope.fillRect(0, 0, this.width, this.height);
            this.drawContextScope.lineWidth = 2;
            this.drawContextScope.strokeStyle = 'rgb(128, 128, 128)';
            this.drawContextScope.beginPath();
            for (var x = this.width / 10; x < this.width; x += this.width / 10) {
                this.drawContextScope.moveTo(x, 0);
                this.drawContextScope.lineTo(x, this.height);
            }

            for (var x = this.width / 100; x < this.width; x += this.width / 100) {
                this.drawContextScope.moveTo(x, this.height / 2 - 2);
                this.drawContextScope.lineTo(x, this.height / 2 + 2);
            }

            for (var y = this.height / 8; y < this.height; y += this.height / 8) {
                this.drawContextScope.moveTo(0, y);
                this.drawContextScope.lineTo(this.width, y);
            }
            for (var y = this.height / 80; y < this.height; y += this.height / 80) {
                this.drawContextScope.moveTo(this.width / 2 - 2, y);
                this.drawContextScope.lineTo(this.width / 2 + 2, y);
            }
            this.drawContextScope.stroke();
        }

        if (risingEdge !== 0 || this.continuedraw !== 0) {



            this.drawContextScope.lineWidth = 2;
            this.drawContextScope.strokeStyle = 'rgb(0, 200, 0)';
            this.drawContextScope.beginPath();

            // risingEdge += Math.floor(deltax/pixeltime);

            var x, nx, vmax = 0,
                mvin = 255;

            for (x = risingEdge; x < times.length; x++) {
                nx = (x - risingEdge) * xratio + this.continuedraw;
                if (nx >= this.width) {
                    break;
                }
                this.drawContextScope.lineTo(nx, this.height / 2 - times[x] * scaling);
            }


            if (x >= times.length) {
                this.continuedraw = nx;
            } else {
                this.continuedraw = 0;
            }

            this.drawContextScope.stroke();
        }
    }

    this.drawlist = [
        this.draw.bind(this)
    ];

    this.scriptNode;

    if (cfg.master) {
        cfg.master.drawlist.push(this.draw.bind(this));
    } else {

        this.scriptNode = context.createScriptProcessor(4096, 1, 1);
        this.scriptNode.onaudioprocess = function (audioProcessingEvent) {
            var inputBuffer = audioProcessingEvent.inputBuffer;
            var outputBuffer = audioProcessingEvent.outputBuffer;

            for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                var inputData = inputBuffer.getChannelData(channel);
                var outputData = outputBuffer.getChannelData(channel);

                for (i = 0; i < this.drawlist.length; i++) {
                    this.drawlist[i](inputData);
                }

                for (var sample = 0; sample < inputBuffer.length; sample++) {
                    outputData[sample] = inputData[sample];
                }
            }

        }.bind(this);


    }

    this.edgeThreshold = 0.01;
    this.setEdgeThreshold = function (v) {
        this.edgeThreshold = parseFloat(v);
    }

    this.neg = false;
    this.setNeg = function (v) {
        this.neg = v;
    }




}

var Freq = function (canvas, cfg) {

    this.analyser = context.createAnalyser();
    this.analyser.minDecibels = -140;
    this.analyser.maxDecibels = 0;
    this.analyser.smoothingTimeConstant = 0;
    this.analyser.fftSize = 1024;

    if (cfg === undefined) {
        cfg = {};
    }

    this.width = cfg.width || canvas.width;
    this.height = cfg.height || canvas.height;

    canvas.width = this.width;
    canvas.height = this.height;

    this.buffer = new Uint8Array(this.analyser.frequencyBinCount);

    function makeloginv(v, minp, maxp, minfreq, maxfreq) {
        var minv = Math.log(minfreq);
        var maxv = Math.log(maxfreq);
        var scale = (maxv - minv) / (maxp - minp);
        var e = Math.log(v) / Math.log(Math.E);
        return (e - minv) / scale + minp;
    }

    this.draw = function (freqs) {

        this.analyser.getByteFrequencyData(this.buffer);

        var drawContext = canvas.getContext('2d');

        drawContext.fillStyle = 'rgb(0, 20, 0)';
        drawContext.fillRect(0, 0, this.width, this.height);

        drawContext.strokeStyle = 'rgb(128, 128, 128)';

        drawContext.beginPath();

        var tick = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

        drawContext.lineWidth = 2;
        drawContext.strokeStyle = 'rgb(128, 128, 128)';

        var maxfreq = context.sampleRate / 2;
        var minfreq = maxfreq / this.analyser.frequencyBinCount;

        for (var i = 0; i < tick.length; i++) {

            var i2 = makeloginv(tick[i], 0, this.width, minfreq, maxfreq);

            if (i2 > 0 && i2 < this.width) {

                drawContext.moveTo(i2, 0);
                drawContext.lineTo(i2, this.height);
            }


        }

        drawContext.stroke();

        drawContext.strokeStyle = 'rgb(0, 200, 0)';
        drawContext.beginPath();

        var maxi = 0;

        for (var i = 0; i < this.buffer.length; i++) {
            var value = this.buffer[i];
            if (value > this.buffer[maxi]) {
                maxi = i;
            }
            var percent = value / 256;
            var height = this.height * percent;
            var offset = this.height - height - 1;
            var position = i * this.width / this.analyser.frequencyBinCount;

            var ifreq = i / this.analyser.frequencyBinCount * (context.sampleRate / 2);

            var i2 = makeloginv(ifreq, 0, this.width, minfreq, maxfreq);

            drawContext.lineTo(i2, this.height - height);


        }
        drawContext.stroke();

        drawContext.strokeStyle = 'rgb(200, 0, 0)';
        drawContext.beginPath();
        var ifreq = maxi / this.analyser.frequencyBinCount * (context.sampleRate / 2);
        var i2 = makeloginv(ifreq, 0, this.width, minfreq, maxfreq);
        drawContext.moveTo(i2, 0);
        drawContext.lineTo(i2, this.height);
        drawContext.stroke();

        var v = freqtonote(ifreq);
        drawContext.font = "24px Arial";
        drawContext.fillStyle = 'rgb(200, 0, 0)';
        if (maxi !== 0) {
            drawContext.fillText(ifreq.toFixed(2) + 'hz ' + v.text + v.octave, 0, 20);
        } else {
            drawContext.fillText(ifreq.toFixed(2) + 'hz ', 0, 20);
        }


        requestAnimationFrame(this.draw.bind(this));
    }
    requestAnimationFrame(this.draw.bind(this));
}




function setfreq(osc, v) {
    osc.frequency.value = v;
}

function setshape(osc, v) {
    osc.typeext = v;
}

function setcycle(osc, v) {
    osc.width.value = v;
}

function setvibrato(v) {
    osc.vibratogain.gain.value = v;
}

function settremolo(v) {
    osc.tremologain.gain.value = v;
}



var EnvelopeFreq;
var EnvelopeFreqVal;

function enableEnvelop(val) {
    osc.PulseEnable(val);
    if (val) {
        setenvelopfreq();
    } else {
        if (EnvelopeFreq) {
            clearTimeout(EnvelopeFreq);
        }
        EnvelopeFreq = undefined;
    }

}

function setenvelopfreq(v) {
    if (v !== undefined) {
        EnvelopeFreqVal = 1000 / v;
    }
    if (EnvelopeFreq) {
        clearTimeout(EnvelopeFreq);
    }
    EnvelopeFreq = setInterval(function () {
        if (document.getElementById('Envelope').checked) {
            osc.Pulse();
        };
    }, EnvelopeFreqVal);
}

function save()
{
    var allElements = document.getElementsByTagName('*');
    var saveobj = {};
    for (var i = 0, n = allElements.length; i < n; i++)
    {
        var data = allElements[i].getAttribute('data-save');
        if ( data !== null)
        {
            var c = data.split('.');
            var targetobj = saveobj;
            for (var j = 0 ; j < c.length - 1; j++) {
                if (targetobj[c[j]]=== undefined) {
                    targetobj[c[j]] = {};
                }
                targetobj = targetobj[c[j]];
            }
            if ( allElements[i].nodeName === 'INPUT' && allElements[i].type==="checkbox" ) {
                targetobj[c[c.length-1]] = allElements[i].checked;
            } else {
                targetobj[c[c.length-1]] = allElements[i].value;
            }
        }
    }
    return saveobj;
}

function load(saveobj)
{
    var allElements = document.getElementsByTagName('*');

    for (var i = 0, n = allElements.length; i < n; i++)
    {
        var data = allElements[i].getAttribute('data-save');
        if ( data !== null)
        { 
            var c = data.split('.');
            var targetobj = saveobj;
            for (var j = 0 ; j < c.length - 1; j++) {
                if (targetobj[c[j]]=== undefined) {
                   break; // abord this one
                }
                targetobj = targetobj[c[j]];
            }
            if ( targetobj[c[c.length-1]] !== undefined) {
                if ( allElements[i].nodeName === 'INPUT' && allElements[i].type==="checkbox" ) {
                    allElements[i].checked = targetobj[c[c.length-1]];
                } else {
                    allElements[i].load(targetobj[c[c.length-1]]);
                }  
            }
        }
    }
}

function savedata()
{
    var s = save();
    document.getElementById('savetext').value = JSON.stringify(s,null,4);


}

function loaddata()
{
    load(JSON.parse(document.getElementById('savetext').value));
}



loadgui();
setenvelopfreq(0.5);

var defval = save();
document.getElementById('savetext').value = JSON.stringify(defval,null,4);
function reset() {
    load(defval);
}