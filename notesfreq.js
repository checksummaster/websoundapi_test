function notetofreq(octave,note)
{
    var A0freq = 27.5;
    var AXFreq = Math.pow(2,octave)*A0freq;
    return AXFreq * Math.pow(Math.pow(2,1/12),note);
}

function freqtonote(v)
{
   var A0freq = 27.5;
   var halftone = Math.round(Math.log(v/A0freq)/Math.log(Math.pow(2,1/12)));


    var octave = Math.floor(halftone/12);
    var note;
    if (halftone >= 0) {
        note = halftone%12;
    } else {
        note = 11 - (-halftone%12);
    }

    var notetable = ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"];

    return {
        octave:octave,
        note: note,
        text: notetable[note]
    }
}