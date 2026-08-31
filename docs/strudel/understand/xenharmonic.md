# XENHARMONIC
Source: https://strudel.cc/learn/xen/
Category: understand

# Xenharmonic Functions (experimental)

These functions allow the use of scales other than your typical chromatic 12 based ones.

### tune(scale)

Here’s an example of how to configure a basic hexany scale:

9

1

i("0 1 2 3 4 5").tune("hexany15").mul("220").freq()

Try other scales like `hexany1`, `iraq`, `gumbeng`, `gunkali`, or `tranh3`

For a full list of available scales from tunejs, see [http://abbernie.github.io/tune/scales.html](http://abbernie.github.io/tune/scales.html)

You can set your root to be a particular note with `getFreq`

9

1

2

3

i("4 8 9 10 - - 5 7 9 11 - -").tune("tranh3")

.mul(getFreq('c3'))

.freq().clip(.5).room(1)

Some tunings become more pronounced with a longer reverb decay:

9

1

2

3

i("<\[5 6 8 10\] - \[5 7 9 12\] -> -").tune("gumbeng")

.mul(getFreq('c3'))

.freq().clip(.8).room("3:10").rdim(10000).rfade(5)

Additionally, you can combo this with `fmap` so that the base note changes:

9

1

2

3

i("9 11 12 10 - - -").tune("gunkali")

.mul("<c3 c3 a3 d#3>".fmap(getFreq))

.freq().legato("2 .7").room("1:15").rdim(8500).rlp(14000).rfade(8)

Combining this with various polyrhythm tricks can become very evocative:

9

1

2

3

4

i("<\[0 3 1 -\] \[-1 4 2 8\]> ~ ~,<-4 -5>".add(4))

.tune("iraq")

.mul("<c3 d3 c#3>".fmap(getFreq))

.freq().clip(.5).room(1).rfade(9)

Another helpful trick when exploring new tunings is to strum them.
Many have a much more enchanting sound that was chosen over many generations of musicians for being strummed.

Take the `sanza` tuning:

9

1

2

3

i("4 5 6 7 8 9").tune("sanza")

.mul(getFreq('c3'))

.freq()

Notes 7 and 9 will clash quite a bit if you arp them normally. Many tunings will have this sort of sound, and it can feel distracting on its own.
See how close they are on the pitch wheel?

9

1

i("\[7 9\]!3").tune("sanza").mul(getFreq('c3')).freq().\_pitchwheel()

This quality is often due to how the tunings were formed with instruments that were played differently than a piano.
As such, some tunings are much better strummed, with the subtle clash of the detuned notes actually making the sound much more magical:

9

1

2

3

4

5

i("\[0 1 2 3 4 5 6\]@0.3 -"

.add("<2 5 8 1>"))

.tune("sanza")

.mul(getFreq('c3')).freq()

.legato("3").room(1).rfade(5)

Note the legato and reverb effects make sure the sound of the strumming gets to wash together. Alternating the direction of the strum can make the
tones sound even more alive, too.

The `tranh3` tuning has a similar set of notes, with two clashing. You might trying plugging that in above and see if you find a favorite strumming pattern.

You can also give tune a list of frequencies to use as the scale:

9

1

2

3

4

5

6

7

8

i("0 1 2 3 4").tune(\[\
\
261.6255653006,\
\
302.72962012827,\
\
350.29154279212,\
\
405.32593044476,\
\
469.00678383895,\
\
523.2511306012\
\
\]).mul(220).freq();

### xen(scaleOrRatios)

Assumes a numerical pattern of scale steps, and a scale. Scales accepted are all preset scale names of `tune`, arbitrary edos such as 31edo, or an array of frequency ratios. Assumes scales repeat at octave (2/1). Returns a new pattern with all values mapped to their associated frequency, assuming a base frequency of 220hz.

- scaleNameOrRatios (string\|Array.<number>):

9

1

2

// A minor triad in 31edo:

i("0 8 18").xen("31edo").piano()

9

1

2

3

4

5

6

7

// You can also use xen with frequency ratios.

// This is equivalent to the above:

i("0 1 2").xen(\[\
\
Math.pow(2,0/31),\
\
Math.pow(2,8/31),\
\
Math.pow(2,18/31),\
\
\]).piano()

9

1

2

3

4

5

// xen also supports all scale names that

// tune does:

i("0 1 2 3 4 5").xen("hexany15")

// equiv to:

// "0 1 2 3 4 5".tune("hexany15").mul("220").freq()

9

1

i("0 1 2 3 4 5 6 7").xen("<5edo 10edo 15edo hexany15>")