
function bytesToSize(bytes,digit) {
    if (digit === undefined) {
        digit = 2;
    }
   var sizes = ['p','n','u','m','', 'K', 'M', 'G', 'T'];
   if (bytes == 0) return '0';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)));
    return (bytes / Math.pow(1000, i)).toFixed(digit) + ' ' + sizes[i+4];
};

function frequencyinput(obj,cfg)
{
    var context = new(window.AudioContext || window.webkitAudioContext)();
    this.freq = cfg.value!=undefined? cfg.value: 440;
    this.min = cfg.min!=undefined? cfg.min: 0.1;
    this.max = cfg.max!=undefined? cfg.max: context.sampleRate / 2;
    if (this.freq < this.min) {
        this.freq = this.min
    }
    if (this.freq > this.max) {
        this.freq = this.max
    }
    this.obj = obj;



    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = 0;
    this.slider.max = 100000;
    this.slider.step = 0.0001;

    obj.appendChild(this.slider);

    var notetable = ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"];
    this.noteselector = document.createElement('select');
    for (var i = 0; i < notetable.length ; i ++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = notetable[i];
        this.noteselector.appendChild(opt);
    }
    obj.appendChild(this.noteselector);

    this.octaveselector = document.createElement('select');
    for (var i = -10; i <=10 ; i ++) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = i;
        this.octaveselector.appendChild(opt);
    }
    obj.appendChild(this.octaveselector);

    this.textvalue = document.createElement('span');
    obj.appendChild(this.textvalue);

    this.makelog = function (v,minp,maxp)
    {
        var minv = Math.log(this.min);
        var maxv = Math.log(this.max);
        var scale = (maxv - minv) / (maxp - minp);
        return  Math.exp(minv + scale * (v - minp));
    }

    this.makeloginv = function (v,minp,maxp)
    {
        var minv = Math.log(this.min);
        var maxv = Math.log(this.max);
        var scale = (maxv - minv) / (maxp - minp);
        var e = Math.log(v)/Math.log(Math.E);
        return (e-minv)/scale + minp;
    }

    this.toString = function()
    {
        return bytesToSize(this.freq) + 'hz ' + bytesToSize(1/this.freq) + 's';
    }

    this.set = function(v)
    {
        this.freq = v;
        this.textvalue.innerHTML = this.toString();
        var o = freqtonote(this.freq);
        this.octaveselector.value = o.octave;
        this.noteselector.value = o.note;
        this.slider.value = this.makeloginv(this.freq,this.slider.min,this.slider.max);
        this.obj.value = this.freq;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
        
    }

    this.slider.onchange = this.slider.oninput = function()
    {
        this.freq = this.makelog(this.slider.value,this.slider.min,this.slider.max);
        this.textvalue.innerHTML = this.toString();
        var o = freqtonote(this.freq);
        this.octaveselector.value = o.octave;
        this.noteselector.value = o.note;
        this.obj.value = this.freq;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
    }.bind(this);

    this.noteselector.onchange = this.octaveselector.onchange = function () 
    {
        this.freq = notetofreq(this.octaveselector.value,this.noteselector.value);
        if (this.freq < this.min) {
            this.freq = this.min
        }
         if (this.freq > this.max) {
            this.freq = this.max
        }
        var o = freqtonote(this.freq);
        this.octaveselector.value = o.octave;
        this.noteselector.value = o.note;

        this.textvalue.innerHTML = this.toString();
        this.slider.value = this.makeloginv(this.freq,this.slider.min,this.slider.max);
        this.obj.value = this.freq;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
    }.bind(this);

    this.set(this.freq);

    obj.load = function(v)
    {
        this.set(v);
    }.bind(this);


}

function timeinput(obj,cfg)
{
    this.time = cfg.value!=undefined?cfg.value : 0.5;
    this.min = cfg.min!=undefined?cfg.min : 0.1;
    this.max = cfg.max!=undefined?cfg.max : 10;
    if (this.time < this.min) {
        this.time = this.min
    }
    if (this.time > this.max) {
        this.time = this.max
    }
    this.obj = obj;

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = this.min;
    this.slider.max = this.max;
    this.slider.step = 0.0001;

    if (!cfg.hideslider) {
        obj.appendChild(this.slider);
    }

    this.selector = document.createElement('select');
    selectortime = [
        0.000001,
        0.000002,
        0.000005,
        0.00001,
        0.00002,
        0.00005,
        0.0001,
        0.0002,
        0.0005,
        0.001,
        0.002,
        0.005,
        0.01,
        0.02,
        0.05,
        0.1,
        0.2,
        0.5,
        1,
        2,
        5
    ]
    for (var i =0; i < selectortime.length ; i ++) {
        if (selectortime[i] >= this.min && selectortime[i] <= this.max) {
            var opt = document.createElement('option');
            opt.value = selectortime[i];
            opt.innerHTML = bytesToSize(selectortime[i],0)+'s';
            this.selector.appendChild(opt);
        }
    }
    obj.appendChild(this.selector);

    this.textvalue = document.createElement('span');
    obj.appendChild(this.textvalue);

    this.toString = function()
    {
        if (cfg.hideslider) {
            return bytesToSize(1/this.time) + 'hz';
        } else {
            return bytesToSize(this.time) + 's ' + bytesToSize(1/this.time) + 'hz';
        }
    }

    this.set = function(v)
    {
        this.time = v;
        this.textvalue.innerHTML = this.toString();
        this.slider.value = v;
        this.selector.value = this.time;
        this.obj.value = this.time;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
        
    }

    this.selector.onchange =  function () 
    {
        this.time = parseFloat(this.selector.value);
        this.textvalue.innerHTML = this.toString();
        this.slider.value =  this.time;
        this.obj.value = this.time;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
        
    }.bind(this);


    this.slider.onchange = this.slider.oninput = function()
    {
        this.time = this.slider.value;
        this.textvalue.innerHTML = this.toString();
        this.selector.value = this.time;
        this.obj.value = this.time;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
    }.bind(this);

    this.set(this.time);

    obj.load = function(v)
    {
        this.set(v);
    }.bind(this);
}

function sliderinput(obj,cfg)
{
    this.value = cfg.value!= undefined ? cfg.value: 0.5;
    this.min = cfg.min!= undefined ? cfg.min : 0.1;
    this.max = cfg.max!= undefined ? cfg.max : 10;
    if (this.value < this.min) {
        this.value = this.min
    }
    if (this.value > this.max) {
        this.value = this.max
    }
    this.obj = obj;

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = this.min;
    this.slider.max = this.max;
    this.slider.step = 0.0001;
    obj.appendChild(this.slider);

    this.textvalue = document.createElement('span');
    obj.appendChild(this.textvalue);

    this.toString = function()
    {
        return this.value;
    }

    this.set = function(v)
    {
        this.value = v;
        this.textvalue.innerHTML = this.toString();
        this.slider.value = v;
        this.obj.value = this.value;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
        
    }

    this.slider.onchange = this.slider.oninput = function()
    {
        this.value = this.slider.value;
        this.textvalue.innerHTML = this.toString();
        this.obj.value = this.value;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
    }.bind(this);

    this.set(this.value);

    obj.load = function(v)
    {
        this.set(v);
    }.bind(this);
}

function shapeinput(obj,cfg)
{
    this.obj = obj;
    this.shape = document.createElement('select');
    var shapes = cfg.shapes || ['sine','square', 'sawtooth', 'triangle','sawtooth rev', 'pwm','noise', 'pink', 'brown'];
    for (var i = 0; i < shapes.length ; i ++) {
        var opt = document.createElement('option');
        opt.value = shapes[i];
        opt.innerHTML = shapes[i];
        this.shape.appendChild(opt);
    }
    obj.appendChild(this.shape);

    this.set = function(v)
    {
        this.shape.value = v;
        this.obj.value = this.shape.value;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
    }.bind(this);

    this.shape.onchange = function () 
    {
        this.obj.value = this.shape.value;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }

    }.bind(this);

    this.obj.value = shapes[0];

    obj.load = function(v)
    {
        this.set(v);
    }.bind(this);

}

function filterinput(obj,cfg)
{
    this.obj = obj;
    this.type = document.createElement('select');
    var types = ['allpass','lowpass', 'highpass', 'bandpass','lowshelf', 'highshelf', 'peaking', 'notch' ];
    for (var i = 0; i < types.length ; i ++) {
        var opt = document.createElement('option');
        opt.value = types[i];
        opt.innerHTML = types[i];
        this.type.appendChild(opt);
    }
    obj.appendChild(this.type);

    this.set = function(v)
    {
        this.type.value = v;
        this.obj.value = this.type.value;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }
    }.bind(this);

    this.type.onchange = function () 
    {
        this.obj.value = this.type.value;
        if (this.obj.onchange ) {
            this.obj.onchange(this.obj );
        }

    }.bind(this);

    this.obj.value = types[0];

    obj.load = function(v)
    {
        this.set(v);
    }.bind(this);

}

function loadgui() {
    var FreqInput = document.getElementsByClassName('frequencyinput');
    for (var i = 0 ; i < FreqInput.length ; i++ ) {
        var cfg = {};
        var data = FreqInput[i].getAttribute('data-config');
        if (data) {
            eval("cfg = " + data);
        }
        FreqInput[i].control = new frequencyinput(FreqInput[i],cfg);
    }

    var TimeInput = document.getElementsByClassName('timeinput');
    for (var i = 0 ; i < TimeInput.length ; i++ ) {
        var cfg = {};
        var data = TimeInput[i].getAttribute('data-config');
        if (data) {
            eval("cfg = " + data);
        }
        TimeInput[i].control = new timeinput(TimeInput[i],cfg);
    }

    var SliderInput = document.getElementsByClassName('sliderinput');
    for (var i = 0 ; i < SliderInput.length ; i++ ) {
        var cfg = {};
        var data = SliderInput[i].getAttribute('data-config');
        if (data) {
            eval("cfg = " + data);
        }
        SliderInput[i].control = new sliderinput(SliderInput[i],cfg);
    }

    var ShapeInput = document.getElementsByClassName('shapeinput');
    for (var i = 0 ; i < ShapeInput.length ; i++ ) {
        var cfg = {};
        var data = ShapeInput[i].getAttribute('data-config');
        if (data) {
            eval("cfg = " + data);
        }
        ShapeInput[i].control = new shapeinput(ShapeInput[i],cfg);
    }

    var FilterInput = document.getElementsByClassName('filterinput');
    for (var i = 0 ; i < FilterInput.length ; i++ ) {
        var cfg = {};
        var data = FilterInput[i].getAttribute('data-config');
        if (data) {
            eval("cfg = " + data);
        }
        FilterInput[i].control = new filterinput(FilterInput[i],cfg);
    }

}