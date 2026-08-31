# AUDIO EFFECTS
Source: https://strudel.cc/learn/effects/
Category: making-sound

# Audio Effects

Whether you’re using a synth or a sample, you can apply any of the following built-in audio effects.
As you might suspect, the effects can be chained together, and they accept a pattern string as their argument.

# Signal chain

![](https://strudel.cc/img/strudel-signal-flow.png)

The signal chain in Strudel is as follows:

- An sound-generating event is triggered by a pattern
  - This has a start time and a duration, which is usually
    controlled by the note length and ADSR parameters
  - If we exceed the max polyphony, old sounds begin to die off
  - Muted sounds (one whose `s` value is `-`, `~`, or `_`) are skipped
- A sound is produced (through, say, a sample or an oscillator)
  - This is where detune-based effects (like `detune`, `penv`, etc. occur)
- The following will occur _in order_ and only if they’ve been called in the pattern. Note that all of these are
single use effects, meaning that multiple occurrences of them in a pattern will simply override the values
(e.g. you can’t do `s("bd").lpf(100).distort(2).lpf(800)` to lowpass, distort, and then lowpass
again)

  - Phase vocoder (`stretch`)
  - Gain is applied (`gain`)

    - This is where the main (volume) ADSR happens
  - A lowpass filter (`lpf`)
  - A highpass filter (`hpf`)
  - A bandpass filter (`bandpass`)
  - A vowel filter (`vowel`)
  - Sample rate reduction (`coarse`)
  - Bit crushing (`crush`)
  - Waveshape distortion (`shape`)
  - Normal distortion (`distort`)
  - Tremolo (`tremolo`)
  - Compressor (`compressor`)
  - Panning (`pan`)
  - Phaser (`phaser`)
  - Postgain (`post`)
- The sound is then split into multiple destinations
  - Dry output (amount controlled by `dry` parameter)
  - The sends
    - Analyzers
      - These are used for tooling like `scope` and `spectrum` and their setup usually happens behind the scenes
    - Delay (amount controlled by `delay` parameter)
    - Reverb (amount controlled by `room` parameter)
- The dry output, delay, and reverb are joined into what is called the “orbit” of the pattern (see more in the section below)
  - The `duck` effect affects the volume of all signals in the orbit
  - The orbit is then sent to the mixer

## Orbits

Orbits are the way in which outputs are handled in Strudel. They also prescribe which delay and reverb to associate with the dry signal.
By default, all orbits are mixed down to channels `1` and `2` in stereo, however with the “Multi Channel Orbits” setting
(under Settings at the right) you can use them as individual 2 channel stereo outs (orbit `i` will be mapped to
to channels `2i` and `2i + 1`). You can then use routers like Blackhole 16 to retrieve and record all of the channels in a DAW for later processing.

The default orbit is `1` and it is set with `orbit`. You may send a sound to multiple orbits via mininotation

```
s("white").orbit("2,3,4").gain(0.2)
```

but please be careful as this will create three copies of the sound behind the scenes, meaning that if they are mixed
down to a single output, they will triple the volume. We’ve reduced the gain here to save your ears.

⚠️ There is only one delay and reverb per orbit, so please be aware that if you attempt to change the parameters on two
patterns pointing to the same orbit, it can lead to unpredictable results. Compare, for example, this pretty pluck
with a large reverb:

```
$: s("triangle*4").decay(0.5).n(irand(12)).scale('C minor')
.room(1).roomsize(10)
```

versus the same pluck with a muted kick drum coming in and overwriting the `roomsize` value:

```
$: s("triangle*4").decay(0.5).n(irand(12)).scale('C minor')
.room(1).roomsize(10)

$: s("bd*4").room(0.01).roomsize(0.01).postgain(0)
```

This is due to them sharing the same orbit: the default of `1`. It can be corrected simply by updating the orbits to be
distinct:

```
$: s("triangle*4").decay(0.5).n(irand(12)).scale('C minor')
.room(1).roomsize(10).orbit(2)

$: s("bd*4").room(0.01).roomsize(0.01).postgain(0)
```

## Continuous changes

As all of the above is triggered by a _sound occurring_, it is often the case that parameters may not be
modified continuously in time. For example,

```
s("supersaw").lpf(tri.range(100, 5000).slow(2))
```

Will not produce a continually LFO’d low-pass filter due to the `tri` only being sampled every time the note hits
(in this case the default of once per cycle). You can fake it by introducing more sound-generating events, e.g.:

```
s("supersaw").seg(16).lpf(tri.range(100, 5000).slow(2))
```

Some parameters _do_ induce continuous variations in time, though:

- The ADSR curve (governed by `attack`, `sustain`, `decay`, `release`)
- The pitch envelope curve (governed by `penv` and its associated ADSR)
- The FM curve (`fmenv`)
- The filter envelopes (`lpenv`, `hpenv`, `bpenv`)
- Tremolo (`tremolo`)
- Phaser (`phaser`)
- Vibrato (`vib`)
- Ducking (`duckorbit`)

# Filters

Filters are an essential building block of [subtractive synthesis](https://en.wikipedia.org/wiki/Subtractive_synthesis).
Strudel comes with 3 types of filters:

- low-pass filter: low frequencies may _pass_, high frequencies are cut off
- high-pass filter: high frequencies may _pass_, low frequencies are cut off
- band-pass filters: only a frequency band may _pass_, low and high frequencies around are cut off

Each filter has 2 parameters:

- cutoff: the frequency at which the filter starts to work. e.g. a low-pass filter with a cutoff of 1000Hz allows frequencies below 1000Hz to pass.
- q-value: Controls the resonance of the filter. Higher values sound more aggressive. Also see [Q-Factor](https://en.wikipedia.org/wiki/Q_factor)

## lpf

Synonyms: `cutoff, ctf, lp`

Applies the cutoff frequency of the **l** ow- **p** ass **f** ilter.

When using mininotation, you can also optionally add the 'lpq' parameter, separated by ':'.

- frequency (number\|Pattern): audible between 0 and 20000

```
s("bd sd [~ bd] sd,hh*6").lpf("<4000 2000 1000 500 200 100>")
```

```
s("bd*16").lpf("1000:0 1000:10 1000:20 1000:30")
```

## lpq

Synonyms: `resonance`

Controls the **l** ow- **p** ass **q**-value.

- q (number\|Pattern): resonance factor between 0 and 50

```
s("bd sd [~ bd] sd,hh*8").lpf(2000).lpq("<0 10 20 30>")
```

## hpf

Synonyms: `hp, hcutoff`

Applies the cutoff frequency of the **h** igh- **p** ass **f** ilter.

When using mininotation, you can also optionally add the 'hpq' parameter, separated by ':'.

- frequency (number\|Pattern): audible between 0 and 20000

```
s("bd sd [~ bd] sd,hh*8").hpf("<4000 2000 1000 500 200 100>")
```

```
s("bd sd [~ bd] sd,hh*8").hpf("<2000 2000:25>")
```

## hpq

Synonyms: `hresonance`

Controls the **h** igh- **p** ass **q**-value.

- q (number\|Pattern): resonance factor between 0 and 50

```
s("bd sd [~ bd] sd,hh*8").hpf(2000).hpq("<0 10 20 30>")
```

## bpf

Synonyms: `bandf, bp`

Sets the center frequency of the **b** and- **p** ass **f** ilter. When using mininotation, you
can also optionally supply the 'bpq' parameter separated by ':'.

- frequency (number\|Pattern): center frequency

```
s("bd sd [~ bd] sd,hh*6").bpf("<1000 2000 4000 8000>")
```

## bpq

Synonyms: `bandq`

Sets the **b** and- **p** ass **q**-factor (resonance).

- q (number\|Pattern): q factor

```
s("bd sd [~ bd] sd").bpf(500).bpq("<0 1 2 3>")
```

## ftype

Sets the filter type. The ladder filter is more aggressive. More types might be added in the future.

- type (number\|Pattern): 12db (0), ladder (1), or 24db (2)

```
note("{f g g c d a a#}%8").s("sawtooth").lpenv(4).lpf(500).ftype("<0 1 2>").lpq(1)
```

```
note("c f g g a c d4").fast(2)
.sound('sawtooth')
.lpf(200).fanchor(0)
.lpenv(3).lpq(1)
.ftype("<ladder 12db 24db>")
```

## vowel

Formant filter to make things sound like vowels.

- vowel (string\|Pattern): You can use a e i o u ae aa oe ue y uh un en an on, corresponding to \[a\] \[e\] \[i\] \[o\] \[u\] \[æ\] \[ɑ\] \[ø\] \[y\] \[ɯ\] \[ʌ\] \[œ̃\] \[ɛ̃\] \[ɑ̃\] \[ɔ̃\]. Aliases: aa = å = ɑ, oe = ø = ö, y = ı, ae = æ.

```
note("[c2 <eb2 <g2 g1>>]*2").s('sawtooth')
.vowel("<a e i <o u>>")
```

```
s("bd sd mt ht bd [~ cp] ht lt").vowel("[a|e|i|o|u]")
```

# Amplitude Modulation

Amplitude modulation changes the amplitude (gain) periodically over time.

## am

## tremolosync

Synonyms: `tremsync`

Modulate the amplitude of a sound with a continuous waveform

- cycles (number\|Pattern): modulation speed in cycles

```
note("d d d# d".fast(4)).s("supersaw").tremolosync("4").tremoloskew("<1 .5 0>")
```

## tremolodepth

Synonyms: `tremdepth`

Depth of amplitude modulation

- depth (number\|Pattern):

```
note("a1 a1 a#1 a1".fast(4)).s("pulse").tremsync(4).tremolodepth("<1 2 .7>")
```

## tremoloskew

Synonyms: `tremskew`

Alter the shape of the modulation waveform

- amount (number\|Pattern): between 0 &amp; 1, the shape of the waveform

```
note("{f a c e}%16").s("sawtooth").tremsync(4).tremoloskew("<.5 0 1>")
```

## tremolophase

Synonyms: `tremphase`

Alter the phase of the modulation waveform

- offset (number\|Pattern): the offset in cycles of the modulation

```
note("{f a c e}%16").s("sawtooth").tremsync(4).tremolophase("<0 .25 .66>")
```

## tremoloshape

Synonyms: `tremshape`

Shape of amplitude modulation

- shape (number\|Pattern): tri \| square \| sine \| saw \| ramp

```
note("{f g c d}%16").tremsync(4).tremoloshape("<sine tri square>").s("sawtooth")
```

# Amplitude Envelope

The amplitude [envelope](https://en.wikipedia.org/wiki/Envelope_(music)) controls the dynamic contour of a sound.
Strudel uses ADSR envelopes, which are probably the most common way to describe an envelope:

![ADSR](https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/ADSR_parameter.svg/1920px-ADSR_parameter.svg.png)

[image link](https://commons.wikimedia.org/wiki/File:ADSR_parameter.svg)

## attack

Synonyms: `att`

Amplitude envelope attack time: Specifies how long it takes for the sound to reach its peak value, relative to the onset.

- attack (number\|Pattern): time in seconds.

```
note("c3 e3 f3 g3").attack("<0 .1 .5>")
```

## decay

Synonyms: `dec`

Amplitude envelope decay time: the time it takes after the attack time to reach the sustain level.
Note that the decay is only audible if the sustain value is lower than 1.

- time (number\|Pattern): decay time in seconds

```
note("c3 e3 f3 g3").decay("<.1 .2 .3 .4>").sustain(0)
```

## sustain

Synonyms: `sus`

Amplitude envelope sustain level: The level which is reached after attack / decay, being sustained until the offset.

- gain (number\|Pattern): sustain level between 0 and 1

```
note("c3 e3 f3 g3").decay(.2).sustain("<0 .1 .4 .6 1>")
```

## release

Synonyms: `rel`

Amplitude envelope release time: The time it takes after the offset to go from sustain level to zero.

- time (number\|Pattern): release time in seconds

```
note("c3 e3 g3 c4").release("<0 .1 .4 .6 1>/2")
```

## adsr

ADSR envelope: Combination of Attack, Decay, Sustain, and Release.

- time (number\|Pattern): attack time in seconds
- time (number\|Pattern): decay time in seconds
- gain (number\|Pattern): sustain level (0 to 1)
- time (number\|Pattern): release time in seconds

```
note("[c3 bb2 f3 eb3]*2").sound("sawtooth").lpf(600).adsr(".1:.1:.5:.2")
```

# Filter Envelope

Each filter can receive an additional filter envelope controlling the cutoff value dynamically. It uses an ADSR envelope similar to the one used for amplitude. There is an additional parameter to control the depth of the filter modulation: `lpenv`\|`hpenv`\|`bpenv`. This allows you to play subtle or huge filter modulations just the same by only increasing or decreasing the depth.

```
note("[c eb g <f bb>](3,8,<0 1>)".sub(12))
.s("<sawtooth>/64")
.lpf(sine.range(300,2000).slow(16))
.lpa(0.005)
.lpd(perlin.range(.02,.2))
.lps(perlin.range(0,.5).slow(3))
.lpq(sine.range(2,10).slow(32))
.release(.5)
.lpenv(perlin.range(1,8).slow(2))
.ftype('24db')
.room(1)
.juxBy(.5,rev)
.sometimes(add(note(12)))
.stack(s("bd*2").bank('RolandTR909'))
.gain(.5).fast(2)
```

There is one filter envelope for each filter type and thus one set of envelope filter parameters preceded either by `lp`, `hp` or `bp`:

- `lpattack`, `lpdecay`, `lpsustain`, `lprelease`, `lpenv`: filter envelope for the lowpass filter.

  - alternatively: `lpa`, `lpd`, `lps`, `lpr` and `lpe`.
- `hpattack`, `hpdecay`, `hpsustain`, `hprelease`, `hpenv`: filter envelope for the highpass filter.

  - alternatively: `hpa`, `hpd`, `hps`, `hpr` and `hpe`.
- `bpattack`, `bpdecay`, `bpsustain`, `bprelease`, `bpenv`: filter envelope for the bandpass filter.

  - alternatively: `bpa`, `bpd`, `bps`, `bpr` and `bpe`.

## lpattack

Synonyms: `lpa`

Sets the attack duration for the lowpass filter envelope.

- attack (number\|Pattern): time of the filter envelope

```
note("c2 e2 f2 g2")
.sound('sawtooth')
.lpf(300)
.lpa("<.5 .25 .1 .01>/4")
.lpenv(4)
```

## lpdecay

Synonyms: `lpd`

Sets the decay duration for the lowpass filter envelope.

- decay (number\|Pattern): time of the filter envelope

```
note("c2 e2 f2 g2")
.sound('sawtooth')
.lpf(300)
.lpd("<.5 .25 .1 0>/4")
.lpenv(4)
```

## lpsustain

Synonyms: `lps`

Sets the sustain amplitude for the lowpass filter envelope.

- sustain (number\|Pattern): amplitude of the lowpass filter envelope

```
note("c2 e2 f2 g2")
.sound('sawtooth')
.lpf(300)
.lpd(.5)
.lps("<0 .25 .5 1>/4")
.lpenv(4)
```

## lprelease

Synonyms: `lpr`

Sets the release time for the lowpass filter envelope.

- release (number\|Pattern): time of the filter envelope

```
note("c2 e2 f2 g2")
.sound('sawtooth')
.clip(.5)
.lpf(300)
.lpenv(4)
.lpr("<.5 .25 .1 0>/4")
.release(.5)
```

## lpenv

Synonyms: `lpe`

Sets the lowpass filter envelope modulation depth.

- modulation (number\|Pattern): depth of the lowpass filter envelope between 0 and n

```
note("c2 e2 f2 g2")
.sound('sawtooth')
.lpf(300)
.lpa(.5)
.lpenv("<4 2 1 0 -1 -2 -4>/4")
```

# Pitch Envelope

You can also control the pitch with envelopes!
Pitch envelopes can breathe life into static sounds:

```
n("<-4,0 5 2 1>*<2!3 4>")
.scale("<C F>/8:pentatonic")
.s("gm_electric_guitar_jazz")
.penv("<.5 0 7 -2>*2").vib("4:.1")
.phaser(2).delay(.25).room(.3)
.size(4).fast(1.5)
```

You also create some lovely chiptune-style sounds:

```
n(run("<4 8>/16")).jux(rev)
.chord("<C^7 <Db^7 Fm7>>")
.dict('ireal')
.voicing().add(note("<0 1>/8"))
.dec(.1).room(.2)
.segment("<4 [2 8]>")
.penv("<0 <2 -2>>").patt(.02).fast(2)
```

Let’s break down all pitch envelope controls:

## pattack

Synonyms: `patt`

Attack time of pitch envelope.

- time (number\|Pattern): time in seconds

```
note("c eb g bb").pattack("0 .1 .25 .5").slow(2)
```

## pdecay

Synonyms: `pdec`

Decay time of pitch envelope.

- time (number\|Pattern): time in seconds

```
note("<c eb g bb>").pdecay("<0 .1 .25 .5>")
```

## prelease

Synonyms: `prel`

Release time of pitch envelope

- time (number\|Pattern): time in seconds

```
note("<c eb g bb> ~")
.release(.5) // to hear the pitch release
.prelease("<0 .1 .25 .5>")
```

## penv

Amount of pitch envelope. Negative values will flip the envelope.
If you don't set other pitch envelope controls, `pattack:.2` will be the default.

- semitones (number\|Pattern): change in semitones

```
note("c")
.penv("<12 7 1 .5 0 -1 -7 -12>")
```

## pcurve

Curve of envelope. Defaults to linear. exponential is good for kicks

- type (number\|Pattern): 0 = linear, 1 = exponential

```
note("g1*4")
.s("sine").pdec(.5)
.penv(32)
.pcurve("<0 1>")
```

## panchor

Sets the range anchor of the envelope:

- anchor 0: range = \[note, note + penv\]
- anchor 1: range = \[note - penv, note\]
If you don't set an anchor, the value will default to the psustain value.

- anchor (number\|Pattern): anchor offset

```
note("c c4").penv(12).panchor("<0 .5 1 .5>")
```

# Dynamics

## gain

Controls the gain by an exponential amount.

- amount (number\|Pattern): gain.

```
s("hh*8").gain(".4!2 1 .4!2 1 .4 1").fast(2)
```

## velocity

Synonyms: `vel`

Sets the velocity from 0 to 1. Is multiplied together with gain.

```
s("hh*8")
.gain(".4!2 1 .4!2 1 .4 1")
.velocity(".4 1")
```

## compressor

Dynamics Compressor. The params are `compressor("threshold:ratio:knee:attack:release")`
More info [here](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode?retiredLocale=de#instance_properties)

```
s("bd sd [~ bd] sd,hh*8")
.compressor("-20:20:10:.002:.02")
```

## postgain

Gain applied after all effects have been processed.

```
s("bd sd [~ bd] sd,hh*8")
.compressor("-20:20:10:.002:.02").postgain(1.5)
```

## xfade

Cross-fades between left and right from 0 to 1:

- 0 = (full left, no right)
- .5 = (both equal)
- 1 = (no left, full right)

```
xfade(s("bd*2"), "<0 .25 .5 .75 1>", s("hh*8"))
```

# Panning

## jux

The jux function creates strange stereo effects, by applying a function to a pattern, but only in the right-hand channel.

```
s("bd lt [~ ht] mt cp ~ bd hh").jux(rev)
```

```
s("bd lt [~ ht] mt cp ~ bd hh").jux(press)
```

```
s("bd lt [~ ht] mt cp ~ bd hh").jux(iter(4))
```

## juxBy

Synonyms: `juxby`

Jux with adjustable stereo width. 0 = mono, 1 = full stereo.

```
s("bd lt [~ ht] mt cp ~ bd hh").juxBy("<0 .5 1>/2", rev)
```

## pan

Sets position in stereo.

- pan (number\|Pattern): between 0 and 1, from left to right (assuming stereo), once round a circle (assuming multichannel)

```
s("[bd hh]*2").pan("<.5 1 .5 0>")
```

```
s("bd rim sd rim bd ~ cp rim").pan(sine.slow(2))
```

# Waveshaping

## coarse

Fake-resampling for lowering the sample rate. Caution: This effect seems to only work in chromium based browsers

- factor (number\|Pattern): 1 for original 2 for half, 3 for a third and so on.

```
s("bd sd [~ bd] sd,hh*8").coarse("<1 4 8 16 32>")
```

## crush

Bit crusher effect.

- depth (number\|Pattern): between 1 (for drastic reduction in bit-depth) to 16 (for barely no reduction).

```
s("<bd sd>,hh*3").fast(2).crush("<16 8 7 6 5 4 3 2>")
```

## distort

Synonyms: `dist`

Wave shaping distortion. CAUTION: it can get loud.
Second option in optional array syntax (ex: ".9:.5") applies a postgain to the output. Third option sets the waveshaping type.
Most useful values are usually between 0 and 10 (depending on source gain). If you are feeling adventurous, you can turn it up to 11 and beyond ;)

- distortion (number\|Pattern): amount of distortion to apply
- volume (number\|Pattern): linear postgain of the distortion
- type (number\|string\|Pattern): type of distortion to apply

```
s("bd sd [~ bd] sd,hh*8").distort("<0 2 3 10:.5>")
```

```
note("d1!8").s("sine").penv(36).pdecay(.12).decay(.23).distort("8:.4")
```

```
s("bd:4*4").bank("tr808").distort("3:0.5:diode")
```

# Global Effects

## Local vs Global Effects

While the above listed “local” effects will always create a separate effects chain for each event,
global effects use the same chain for all events of the same orbit:

## orbit

Synonyms: `o`

An `orbit` is a global parameter context for patterns. Patterns with the same orbit will share the same global effects.

- number (number\|Pattern):

```
stack(
  s("hh*6").delay(.5).delaytime(.25).orbit(1),
  s("~ sd ~ sd").delay(.5).delaytime(.125).orbit(2)
)
```

## Delay

### delay

Sets the level of the delay signal.

When using mininotation, you can also optionally add the 'delaytime' and 'delayfeedback' parameter,
separated by ':'.

- level (number\|Pattern): between 0 and 1

```
s("bd bd").delay("<0 .25 .5 1>")
```

```
s("bd bd").delay("0.65:0.25:0.9 0.65:0.125:0.7")
```

### delaytime

Synonyms: `delayt, dt`

Sets the time of the delay effect in seconds.

- delay (number\|Pattern): in seconds

```
note("d d a# a".fast(2))
.s("sawtooth")
.delay(.8)
.delaytime(1/2)
.delayspeed("<2 .5 -1 -2>")
```

### delayfeedback

Synonyms: `delayfb, dfb`

Sets the level of the signal that is fed back into the delay.
Caution: Values >= 1 will result in a signal that gets louder and louder! Don't do it

- feedback (number\|Pattern): between 0 and 1

```
s("bd").delay(.25).delayfeedback("<.25 .5 .75 1>")
```

## Reverb

### room

Sets the level of reverb.

When using mininotation, you can also optionally add the 'size' parameter, separated by ':'.

- level (number\|Pattern): between 0 and 1

```
s("bd sd [~ bd] sd").room("<0 .2 .4 .6 .8 1>")
```

```
s("bd sd [~ bd] sd").room("<0.9:1 0.9:4>")
```

### roomsize

Synonyms: `rsize, sz, size`

Sets the room size of the reverb, see `room`.
When this property is changed, the reverb will be recaculated, so only change this sparsely..

- size (number\|Pattern): between 0 and 10

```
s("bd sd [~ bd] sd").room(.8).rsize(1)
```

```
s("bd sd [~ bd] sd").room(.8).rsize(4)
```

### roomfade

Synonyms: `rfade`

Reverb fade time (in seconds).
When this property is changed, the reverb will be recaculated, so only change this sparsely..

- seconds (number): for the reverb to fade

```
s("bd sd [~ bd] sd").room(0.5).rlp(10000).rfade(0.5)
```

```
s("bd sd [~ bd] sd").room(0.5).rlp(5000).rfade(4)
```

### roomlp

Synonyms: `rlp`

Reverb lowpass starting frequency (in hertz).
When this property is changed, the reverb will be recaculated, so only change this sparsely..

- frequency (number): between 0 and 20000hz

```
s("bd sd [~ bd] sd").room(0.5).rlp(10000)
```

```
s("bd sd [~ bd] sd").room(0.5).rlp(5000)
```

### roomdim

Synonyms: `rdim`

Reverb lowpass frequency at -60dB (in hertz).
When this property is changed, the reverb will be recaculated, so only change this sparsely..

- frequency (number): between 0 and 20000hz

```
s("bd sd [~ bd] sd").room(0.5).rlp(10000).rdim(8000)
```

```
s("bd sd [~ bd] sd").room(0.5).rlp(5000).rdim(400)
```

### iresponse

Synonyms: `ir`

Sets the sample to use as an impulse response for the reverb.

- sample (string\|Pattern): to use as an impulse response

```
s("bd sd [~ bd] sd").room(.8).ir("<shaker_large:0 shaker_large:2>")
```

## Phaser

### phaser

Synonyms: `ph`

Phaser audio effect that approximates popular guitar pedals.

- speed (number\|Pattern): speed of modulation

```
n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
.phaser("<1 2 4 8>")
```

### phaserdepth

Synonyms: `phd, phasdp`

The amount the signal is affected by the phaser effect. Defaults to 0.75

- depth (number\|Pattern): number between 0 and 1

```
n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
.phaser(2).phaserdepth("<0 .5 .75 1>")
```

### phasercenter

Synonyms: `phc`

The center frequency of the phaser in HZ. Defaults to 1000

- centerfrequency (number\|Pattern): in HZ

```
n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
.phaser(2).phasercenter("<800 2000 4000>")
```

### phasersweep

Synonyms: `phs`

The frequency sweep range of the lfo for the phaser effect. Defaults to 2000

- phasersweep (number\|Pattern): most useful values are between 0 and 4000

```
n(run(8)).scale("D:pentatonic").s("sawtooth").release(0.5)
.phaser(2).phasersweep("<800 2000 4000>")
```

## Duck

### duckorbit

Synonyms: `duck`

Modulate the amplitude of an orbit to create a "sidechain" like effect.

Can be applied to multiple orbits with the ':' mininotation, e.g. `duckorbit("2:3")`

- orbit (number\|Pattern): target orbit

```
$: n(run(16)).scale("c:minor:pentatonic").s("sawtooth").delay(.7).orbit(2)
$: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit(2).duckattack(0.2).duckdepth(1)
```

```
$: n(run(16)).scale("c:minor:pentatonic").s("sawtooth").delay(.7).orbit(2)
$: s("hh*16").orbit(3)
$: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit("2:3").duckattack(0.2).duckdepth(1)
```

### duckattack

Synonyms: `duckatt, datt`

The time required for the ducked signal(s) to return to their normal volume.

Can vary across orbits with the ':' mininotation, e.g. `duckonset("0:0.003")`.
Note: this requires first applying the effect to multiple orbits with e.g. `duckorbit("2:3")`.

- time (number\|Pattern): The attack time in seconds

```
sound: n(run(8)).scale("c:minor").s("sawtooth").delay(.7).orbit(2)
ducker: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit(2).duckattack("<0.2 0 0.4>").duckdepth(1)
```

```
moreduck: n(run(8)).scale("c:minor").s("sawtooth").delay(.7).orbit(2)
lessduck: s("hh*16").orbit(5)
ducker: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit("2:5").duckattack("0.4:0.1")
```

### duckdepth

The amount of ducking applied to target orbit

Can vary across orbits with the ':' mininotation, e.g. `duckdepth("0.3:0.1")`.
Note: this requires first applying the effect to multiple orbits with e.g. `duckorbit("2:3")`.

- depth (number\|Pattern): depth of modulation from 0 to 1

```
stack( n(run(8)).scale("c:minor").s("sawtooth").delay(.7).orbit(2), s("bd:4!4").beat("0,4,8,11,14",16).duckorbit(2).duckattack(0.2).duckdepth("<1 .9 .6 0>"))
```

```
$: n(run(16)).scale("c:minor:pentatonic").s("sawtooth").delay(.7).orbit(2)
$: s("hh*16").orbit(3)
$: s("bd:4!4").beat("0,4,8,11,14",16).duckorbit("2:3").duckattack(0.2).duckdepth("1:0.5")
```

Next, we’ll look at input / output via [MIDI, OSC and other methods](https://strudel.cc/learn/input-output/).