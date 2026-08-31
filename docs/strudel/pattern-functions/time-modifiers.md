# TIME MODIFIERS
Source: https://strudel.cc/learn/time-modifiers/
Category: pattern-functions

# Time Modifiers

The following functions modify a pattern temporal structure in some way.
Some of these have equivalent operators in the Mini Notation:

| function | mini |
| --- | --- |
| `"x".slow(2)` | `"x/2"` |
| `"x".fast(2)` | `"x*2"` |
| `"x".euclid(3,8)` | `"x(3,8)"` |
| `"x".euclidRot(3,8,1)` | `"x(3,8,1)"` |

## slow

Synonyms: `sparsity`

Slow down a pattern over the given number of cycles. Like the "/" operator in mini notation.

- factor (number\|Pattern): slow down factor

9

1

s("bd hh sd hh").slow(2)// s("\[bd hh sd hh\]/2")

## fast

Synonyms: `density`

Speed up a pattern by the given factor. Used by "\*" in mini notation.

- factor (number\|Pattern): speed up factor

9

1

s("bd hh sd hh").fast(2)// s("\[bd hh sd hh\]\*2")

## early

Nudge a pattern to start earlier in time. Equivalent of Tidal's <~ operator

- cycles (number\|Pattern): number of cycles to nudge left

9

1

"bd ~".stack("hh ~".early(.1)).s()

## late

Nudge a pattern to start later in time. Equivalent of Tidal's ~> operator

- cycles (number\|Pattern): number of cycles to nudge right

9

1

"bd ~".stack("hh ~".late(.1)).s()

## clip / legato

Synonyms: `legato`

Multiplies the duration with the given number. Also cuts samples off at the end if they exceed the duration.

- factor (number\|Pattern):
= 0


9

1

note("c a f e").s("piano").clip("<.5 1 2>")

## euclid

Changes the structure of the pattern to form an Euclidean rhythm.
Euclidean rhythms are rhythms obtained using the greatest common
divisor of two numbers. They were described in 2004 by Godfried
Toussaint, a Canadian computer scientist. Euclidean rhythms are
really useful for computer/algorithmic music because they can
describe a large number of rhythms with a couple of numbers.

- pulses (number): the number of onsets/beats
- steps (number): the number of steps to fill

9

1

2

// The Cuban tresillo pattern.

note("c3").euclid(3,8)

### euclidRot

Like `euclid`, but has an additional parameter for 'rotating' the resulting sequence.

- pulses (number): the number of onsets/beats
- steps (number): the number of steps to fill
- rotation (number): offset in steps

9

1

2

// A Samba rhythm necklace from Brazil

note("c3").euclidRot(3,16,14)

### euclidLegato

Similar to `euclid`, but each pulse is held until the next pulse,
so there will be no gaps.

- pulses (number): the number of onsets/beats
- steps (number): the number of steps to fill
- rotation (): offset in steps
- pat ():

9

1

note("c3").euclidLegato(3,8)

## rev

Reverse all cycles in a pattern. See also `revv` for reversing a whole pattern.

9

1

note("c d e g").rev()

## palindrome

Applies `rev` to a pattern every other cycle, so that the pattern alternates between forwards and backwards.

9

1

note("c d e g").palindrome()

## iter

Divides a pattern into a given number of subdivisions, plays the subdivisions in order, but increments the starting subdivision each cycle. The pattern wraps to the first subdivision after the last subdivision is played.

9

1

note("0 1 2 3".scale('A minor')).iter(4)

### iterBack

Synonyms: `iterback`

Like `iter`, but plays the subdivisions in reverse order. Known as iter' in tidalcycles

9

1

note("0 1 2 3".scale('A minor')).iterBack(4)

## ply

The ply function repeats each event the given number of times.

9

1

s("bd ~ sd cp").ply("<1 2 3>")

## segment

Synonyms: `seg`

Samples the pattern at a rate of n events per cycle. Useful for turning a continuous pattern into a discrete one.

- segments (number): number of segments per cycle

9

1

note(saw.range(40,52).segment(24))

## compress

Compress each cycle into the given timespan, leaving a gap

9

1

2

3

4

cat(

s("bd sd").compress(.25,.75),

s("~ bd sd ~")

)

## zoom

Plays a portion of a pattern, specified by the beginning and end of a time span. The new resulting pattern is played over the time period of the original pattern:

9

1

2

s("bd\*2 hh\*3 \[sd bd\]\*2 perc").zoom(0.25,0.75)

// s("hh\*3 \[sd bd\]\*2") // equivalent

## linger

Selects the given fraction of the pattern and repeats that part to fill the remainder of the cycle.

- fraction (number): fraction to select

9

1

s("lt ht mt cp, \[hh oh\]\*2").linger("<1 .5 .25 .125>")

## fastGap

Synonyms: `fastgap`

speeds up a pattern like fast, but rather than it playing multiple times as fast would it instead leaves a gap in the remaining space of the cycle. For example, the following will play the sound pattern "bd sn" only once but compressed into the first half of the cycle, i.e. twice as fast.

9

1

s("bd sd").fastGap(2)

## inside

Carries out an operation 'inside' a cycle.

9

1

2

"0 1 2 3 4 3 2 1".inside(4,rev).scale('C major').note()

// "0 1 2 3 4 3 2 1".slow(4).rev().fast(4).scale('C major').note()

## outside

Carries out an operation 'outside' a cycle.

9

1

2

"<\[0 1\] 2 \[3 4\] 5>".outside(4,rev).scale('C major').note()

// "<\[0 1\] 2 \[3 4\] 5>".fast(4).rev().slow(4).scale('C major').note()

## cpm

Plays the pattern at the given cycles per minute.

9

1

s("<bd sd>,hh\*2").cpm(90)// = 90 bpm

## ribbon

Synonyms: `rib`

Loops the pattern inside an `offset` for `cycles`.
If you think of the entire span of time in cycles as a ribbon, you can cut a single piece and loop it.

- offset (number): start point of loop in cycles
- cycles (number): loop length in cycles

9

1

note("<c d e f>").ribbon(1,2)

9

1

2

// Looping a portion of randomness

n(irand(8).segment(4)).scale("c:pentatonic").ribbon(1337,2)

9

1

2

// rhythm generator

s("bd!16?").ribbon(29,.5)

## swingBy

The function `swingBy x n` breaks each cycle into `n` slices, and then delays events in the second half of each slice by the amount `x`, which is relative to the size of the (half) slice. So if `x` is 0 it does nothing, `0.5` delays for half the note duration, and 1 will wrap around to doing nothing again. The end result is a shuffle or swing-like rhythm

- subdivision (number):
- offset (number):

9

1

s("hh\*8").swingBy(1/3,4)

## swing

Shorthand for swingBy with 1/3:

- subdivision (number):

9

1

2

s("hh\*8").swing(4)

// s("hh\*8").swingBy(1/3, 4)

Apart from modifying time, there are ways to [Control Parameters](https://strudel.cc/functions/value-modifiers/).