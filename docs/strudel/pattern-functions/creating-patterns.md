# CREATING PATTERNS
Source: https://strudel.cc/learn/factories/
Category: pattern-functions

# Creating Patterns

The following functions will return a pattern.
These are the equivalents used by the Mini Notation:

| function | mini |
| --- | --- |
| `cat(x, y)` | `"<x y>"` |
| `seq(x, y)` | `"x y"` |
| `stack(x, y)` | `"x,y"` |
| `stepcat([3,x],[2,y])` | `"x@3 y@2"` |
| `polymeter([a, b, c], [x, y])` | `"{a b c, x y}"` |
| `polymeterSteps(2, x, y, z)` | `"{x y z}%2"` |
| `silence` | `"~"` |

## cat

Synonyms: `slowcat`

The given items are con **cat** enated, where each one takes one cycle.

- items (any): The items to concatenate

9

1

2

cat("e5","b4",\["d5","c5"\]).note()

// "<e5 b4 \[d5 c5\]>".note()

9

1

2

3

4

// As a chained function:

s("hh\*4").cat(

note("c4(5,8)")

)

## seq

Synonyms: `fastcat`

Like **cat**, but the items are crammed into one cycle.

9

1

2

seq("e5","b4",\["d5","c5"\]).note()

// "e5 b4 \[d5 c5\]".note()

9

1

2

3

4

// As a chained function:

s("hh\*4").seq(

note("c4(5,8)")

)

## stack

Synonyms: `polyrhythm, pr`

The given items are played at the same time at the same length.

9

1

2

stack("g3","b3",\["e4","d4"\]).note()

// "g3,b3,\[e4 d4\]".note()

9

1

2

3

4

// As a chained function:

s("hh\*4").stack(

note("c4(5,8)")

)

## stepcat

Synonyms: `timeCat, timecat`

'Concatenates' patterns like `fastcat`, but proportional to a number of steps per cycle.
The steps can either be inferred from the pattern, or provided as a \[length, pattern\] pair.
Has the alias `timecat`.

9

1

2

stepcat(\[3,"e3"\],\[1,"g3"\]).note()

// the same as "e3@3 g3".note()

9

1

2

stepcat("bd sd cp","hh hh").sound()

// the same as "bd sd cp hh hh".sound()

## arrange

Allows to arrange multiple patterns together over multiple cycles.
Takes a variable number of arrays with two elements specifying the number of cycles and the pattern to use.

9

1

2

3

4

arrange(

\[4,"<c a f e>(3,8)"\],

\[2,"<g a>(5,8)"\]

).note()

## polymeter

Synonyms: `pm`

_Experimental_

Aligns the steps of the patterns, creating polymeters. The patterns are repeated until they all fit the cycle. For example, in the below the first pattern is repeated twice, and the second is repeated three times, to fit the lowest common multiple of six steps.

9

1

2

// The same as note("{c eb g, c2 g2}%6")

polymeter("c eb g","c2 g2").note()

## polymeterSteps

## silence

Does absolutely nothing..

9

1

silence// "~"

## run

A discrete pattern of numbers from 0 to n-1

9

1

2

n(run(4)).scale("C4:pentatonic")

// n("0 1 2 3").scale("C4:pentatonic")

## binary

Creates a binary pattern from a number.

- n (number): input number to convert to binary

9

1

2

"hh".s().struct(binary(5))

// "hh".s().struct("1 0 1")

## binaryN

Creates a binary pattern from a number, padded to n bits long.

- n (number): input number to convert to binary
- nBits (number): pattern length, defaults to 16

9

1

2

"hh".s().struct(binaryN(55532,16))

// "hh".s().struct("1 1 0 1 1 0 0 0 1 1 1 0 1 1 0 0")

After Pattern Constructors, let’s see what [Time Modifiers](https://strudel.cc/learn/time-modifiers/) are available.