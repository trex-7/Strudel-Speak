# MONDO NOTATION
Source: https://strudel.cc/learn/mondo-notation/
Category: guides

# Mondo Notation

“Mondo Notation” is a new kind of notation that is similar to [Mini Notation](https://strudel.cc/learn/mini-notation/), but with enough abilities to make it work as a standalone pattern language.
Here’s an example:

99

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

$ note (c2 # euclid <3 6 3> <8 16>) # \*2

\# s "sine" # add (note \[0 <12 24>\]\*2)

\# dec(sine # range .2 2)

\# room .5

\# lpf (sine/3 # range 120 400)

\# lpenv (rand # range .5 4)

\# lpq (perlin # range 5 12 # \* 2)

\# dist 1 # fm 4 # fmh 5.01 # fmdecay <.1 .2>

\# postgain .6 # delay .1 # clip 5

$ s \[bd bd bd bd\] # bank tr909 # clip .5

\# ply <1 \[1 \[2 4\]\]>

$ s oh\*4 # press # bank tr909 # speed.8

\# dec (<.02 .05>\*2 # add (saw/8 # range 0 1))

## Mondo in the REPL

For now, you can only use mondo in the repl like this:

9

1

mondo\`s hh\*8\`

The rest of this site will only use the mondo notation itself.
In the future, the REPL might get a way to use mondo notation directly.

## Calling Functions

Compared to Mini Notation, the most notable feature of Mondo Notation is the ability to call functions using round brackets:

9

1

(s hh\*8)

The first element inside the brackets is the function name. In JS, this would look like:

9

1

s("hh\*8")

The outermost parens are not needed, so we can drop them:

9

1

s hh\*8

## Mini Notation Features

Besides function calling with round parens, Mondo Notation has a lot in common with Mini Notation:

### Brackets

- `[]` for 1-cycle sequences
- `<>` for multi-cycle sequences
- `{}` for stepped sequences (more on that later)

### Infix Operators

- \\* =\> [fast](https://strudel.cc/learn/time-modifiers/#fast)
- / =\> [slow](https://strudel.cc/learn/time-modifiers/#slow)
- ! =\> [extend](https://strudel.cc/learn/stepwise/#extend)
- @ =\> [expand](https://strudel.cc/learn/stepwise/#expand)
- % =\> [pace](https://strudel.cc/learn/stepwise/#pace)
- ? =\> [degradeBy](https://strudel.cc/learn/random-modifiers/#degradeby) (currently requires right operand)
- : =\> tail (creates a list)
- .. =\> range (between numbers)
- , =\> [stack](https://strudel.cc/learn/factories/#stack)
- \| =\> [chooseIn](https://strudel.cc/learn/random-modifiers/#choose)

### Example

99

1

2

3

4

5

6

7

8

9

10

note <

\[e5 \[b4 c5\] d5 \[c5 b4\]\]

\[a4 \[a4 c5\] e5 \[d5 c5\]\]

\[b4 \[~ c5\] d5 e5\]

\[c5 a4 a4 ~\]

\[\[~ d5\] \[~ f5\] a5 \[g5 f5\]\]

\[e5 \[~ c5\] e5 \[d5 c5\]\]

\[b4 \[b4 c5\] d5 e5\]

\[c5 a4 a4 ~\]

>

## Chaining Functions

Similar to how ”.” works in javascript (JS), we can chain functions calls with the ”#” operator:

9

1

2

3

4

5

n <0 2 4 \[3 1\] -1>\*4

\# scale C4:minor

\# jux rev

\# dec .2

\# delay .5

Here’s the same written in JS:

9

1

2

3

4

5

n("<0 2 4 \[3 1\] -1>\*4")

.scale("C4:minor")

.jux(rev)

.dec(.2)

.delay(.5)

### Chaining Functions Locally

A function can be applied to a single element by wrapping it in round parens:

9

1

s \[bd hh bd (cp # delay .6)\] # bank tr909

in this case, `delay .6` will only be applied to `cp`. compare this with the JS version:

9

1

s(seq("bd","hh","bd","cp".delay(.6))).bank('tr909')

here we can see how much we can save when there’s no boundary between mini notation and function calls!

### Chaining Infix Operators

Infix operators exist as regular functions, so they can be chained as well:

9

1

s \[bd hh\] # bank tr909 # \*2

In this case, the \*2 will be applied to the whole pattern.

### Lambda Functions

Some functions in strudel expect a function as input, for example:

9

1

n("0 .. 7").scale("C:minor").sometimes(x=>x.dec(.1))

in mondo, the `x=>x.` can be shortened to:

9

1

n 0..7 # scale C:minor # sometimes (# dec .1)

chaining works as expected:

9

1

n 0..7 # scale C:minor # sometimes (# dec .1 # jux rev)

## Strings

You can use “double quotes” and ‘single quotes’ to get a string:

9

1

n 0..7 # scale 'C minor'

## Multiple Patterns

The `$` sign can be used to separate multiple patterns:

9

1

2

3

$ s \[bd rim \[~ bd\] rim\] # bank tr707

$ chord <Dm9!3 Db7> # voicing

\# struct\[x ~ ~ x ~ x ~ ~\] # delay .5

The `$` sign is an alias for `,` so it will create a stack behind the scenes.

## variables

using the `def` keyword, you can define variables:

9

1

2

3

4

$ def melody \[0 1 2 3\]

$ n melody # scale C:minor