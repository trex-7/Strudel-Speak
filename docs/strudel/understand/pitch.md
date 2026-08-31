# PITCH
Source: https://strudel.cc/understand/pitch/
Category: understand

# Understanding Pitch

Let’s learn how pitch works! The slider below controls the frequency of an oscillator, producing a pitch:

220Hz

- Drag the slider to hear a pitch
- Move the slider to change the pitch
- Observe how the Hz number changes
- Caution: The higher frequencies could be disturbing for children or animals!

The Hz number is the frequency of the pitch you’re hearing.
The higher the frequency, the higher the pitch and vice versa.
A pitch occurs whenever something is vibrating / oscillating at a frequency, in this case it’s your speaker.
The unit **Hz** describes how many times that oscillation happens per second.
Our eyes are too slow to actually see the oscillation on the speaker, but we can [see it in slow motion](https://www.youtube.com/watch?v=CDMBWw7OuJQ).

The hearing range of a newborn is said to be between 20Hz and 20000Hz.
The upper limit decreases with age. What’s your upper limit?

In Strudel, we can play frequencies directly with the `freq` control:

```
freq("<200 [300,500] 400 [500,<600 670 712 670>]>*8")
```

## Frequency vs Pitch Perception

Maybe you have already noticed that the frequency slider is “lopsided”,
meaning the pitch changes more in the left region and less in the right region.

To make that more obvious, let’s add a pitch slider
that controls the frequency on a different scale:

220Hz = 55Hz \* 22

Frequency SweepPitch Sweep

Try out the buttons above to sweep through the frequency range in 2 different ways:

- Frequency Sweep: frequency rises linear , pitch rises logarithmic
- Pitch Sweep: frequency rises exponential , pitch rises linear

Don’t be scared of these mathematical terms:

- “logarithmic” is just a fancy way of saying “it starts fast and slows down”
- “exponential” is just a fancy way of saying “it starts slow and gets faster”

Most of the time, we might want to control pitch in a way that matches our perception,
which is what the pitch slider does.

## From Hz to Semitones

Because Hz does not match our perception, let’s try to find a unit for pitch that matches.
To approach that unit of pitch, let’s look at how frequency behaves when it is doubled:

220Hz = 55Hz \* 22

- Use the now stepped pitch slider above
- Can you hear how these pitches seem related to each other?

In musical terms, a pitch with double the frequency of another is an `octave` higher.

Because octaves are pretty far apart, octaves are typically divided into 12 smaller parts:

440Hz = 440Hz \* 20

This step is also called a semitone, which is the most common division of pitched music.
For example, the keys on a piano keyboard are also divided into semitones.

In Strudel, we could do that with `freq` like this:

```
freq(
"0 4 7 12"
.fmap(n => 440 * 2**(n/12))
)
```

Of course, this can be written shorter with note, as we will see below.

## From Semitones to MIDI numbers

Now we know what the distance of a semitone is.
Above, we used an arbitrary base frequency of 440Hz, which means the exponent 0 is equal to 440Hz.
Typically, 440Hz is standardized to the number 69, which leads to this calculation:

440Hz = 440Hz \* 2(69 \- 69)/12

The yellow number is now a MIDI number, covering more than the whole human hearing range with numbers from 0 to 127.
In Strudel, we can use MIDI numbers inside `note`:

```
note("69 73 76 81")
```

## From MIDI numbers to notes

In western music theory, notes are used instead of numbers.
For each midi number, there is at least one note label:

440Hz = 440Hz \* 2(69 \- 69)/12= A4

A4A4

A full note label consists of a letter (A-G), 0 or more accidentals (b \| #) and an octave number.
This system is also known as [Scientific Pitch Notation](https://en.wikipedia.org/wiki/Scientific_pitch_notation).
In Strudel, these note labels can also be used inside `note` as an alternative to midi numbers:

```
note("A4 C#5 E5 A5").piano()
```

## Open Questions

Now that we have learned about different representations of pitch, there are still open questions:

- Why 12 notes? What about different divisions of the octave?
- Why are notes labeled as they are? Why only 7 letters?
- Are there other labeling systems?
- What about Just Intonation Systems?
- What about Timbre?

All those questions are important to ask and will be answered in another article.

## Definition

At first, I wanted to start this article with a definition, but then thought it might be a good idea to focus on intuitive exploration.
Maybe you now understand this definition much better:

From [wikipedia](https://en.wikipedia.org/wiki/Pitch_(music)): “Pitch is a perceptual property of sounds that allows their ordering on a frequency-related scale, or more commonly, pitch is the quality that makes it possible to judge sounds as “higher” and “lower” in the sense associated with musical melodies.”