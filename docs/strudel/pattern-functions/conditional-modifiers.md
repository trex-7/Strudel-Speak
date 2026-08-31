# CONDITIONAL MODIFIERS
Source: https://strudel.cc/learn/conditional-modifiers/
Category: pattern-functions

# Conditional Modifiers

## lastOf

Applies the given function every n cycles, starting from the last cycle.

- n (number): how many cycles
- func (function): function to apply

9

1

note("c3 d3 e3 g3").lastOf(4,x=>x.rev())

## firstOf

Applies the given function every n cycles, starting from the first cycle.

- n (number): how many cycles
- func (function): function to apply

9

1

note("c3 d3 e3 g3").firstOf(4,x=>x.rev())

## when

Applies the given function whenever the given pattern is in a true state.

- binary\_pat (Pattern):
- func (function):

9

1

"c3 eb3 g3".when("<0 1>/2",x=>x.sub("5")).note()

## chunk

Synonyms: `slowChunk, slowchunk`

Divides a pattern into a given number of parts, then cycles through those parts in turn, applying the given function to each part in turn (one part per cycle).

9

1

2

"0 1 2 3".chunk(4,x=>x.add(7))

.scale("A:minor").note()

### chunkBack

Synonyms: `chunkback`

Like `chunk`, but cycles through the parts in reverse order. Known as chunk' in tidalcycles

9

1

2

"0 1 2 3".chunkBack(4,x=>x.add(7))

.scale("A:minor").note()

### fastChunk

Synonyms: `fastchunk`

Like `chunk`, but the cycles of the source pattern aren't repeated
for each set of chunks.

9

1

2

3

"<0 8> 1 2 3 4 5 6 7"

.scale("C2:major").note()

.fastChunk(4,x=>x.color('red')).slow(2)

## arp

Selects indices in in stacked notes.

9

1

2

note("<\[c,eb,g\]!2 \[c,f,ab\] \[d,f,ab\]>")

.arp("0 \[0,2\] 1 \[0,2\]")

## arpWith 🧪

Selects indices in in stacked notes.

9

1

2

note("<\[c,eb,g\]!2 \[c,f,ab\] \[d,f,ab\]>")

.arpWith(haps=>haps\[2\])

## struct

Applies the given structure to the pattern:

9

1

2

3

note("c,eb,g")

.struct("x ~ x ~ ~ x ~ x ~ ~ ~ x ~ x ~ ~")

.slow(2)

## mask

Returns silence when mask is 0 or "~"

9

1

note("c \[eb,g\] d \[eb,g\]").mask("<1 \[0 1\]>")

## reset

Resets the pattern to the start of the cycle for each onset of the reset pattern.

9

1

s("\[<bd lt> sd\]\*2, hh\*8").reset("<x@3 x(5,8)>")

## restart

Restarts the pattern for each onset of the restart pattern.
While reset will only reset the current cycle, restart will start from cycle 0.

9

1

s("\[<bd lt> sd\]\*2, hh\*8").restart("<x@3 x(5,8)>")

## hush

Silences a pattern.

9

1

2

3

4

stack(

s("bd").hush(),

s("hh\*3")

)

## invert

Synonyms: `inv`

Swaps 1s and 0s in a binary pattern.

9

1

s("bd").struct("1 0 0 1 0 0 1 0".lastOf(4,invert))

## pick

Picks patterns (or plain values) either from a list (by index) or a lookup table (by name).
Similar to `inhabit`, but maintains the structure of the original patterns.

- pat (Pattern):
- xs (\*):

9

1

note("<0 1 2!2 3>".pick(\["g a","e f","f g f g","g c d"\]))

9

1

sound("<0 1 \[2,0\]>".pick(\["bd sd","cp cp","hh hh"\]))

9

1

sound("<0!2 \[0,1\] 1>".pick(\["bd(3,8)","sd sd"\]))

9

1

s("<a!2 \[a,b\] b>".pick({a:"bd(3,8)",b:"sd sd"}))

## pickmod

The same as `pick`, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.
For example, if you pick the fifth pattern of a list of three, you'll get the
second one.

- pat (Pattern):
- xs (\*):

## pickF

pickF lets you use a pattern of numbers to pick which function to apply to another pattern.

- pat (Pattern):
- lookup (Pattern): a pattern of indices or names
- lookup (Array.<function()>\|object): the array or lookup object of functions from which to pull

9

1

s("bd \[rim hh\]").pickF("<0 1 2>",\[rev,jux(rev),fast(2)\])

9

1

2

note("<c2 d2>(3,8)").s("square")

.pickF("<0 2> 1",\[jux(rev),fast(2),x=>x.lpf(800)\])

9

1

2

note("<c2 d2>(3,8)").s("square")

.pickF("<jr l> f",{jr:jux(rev),f:fast(2),l:x=>x.lpf(800)})

## pickmodF

The same as `pickF`, but if you pick a number greater than the size of the functions list,
it wraps around, rather than sticking at the maximum value.

- pat (Pattern):
- lookup (Pattern): a pattern of indices or names
- lookup (Array.<function()>\|object): the array or lookup object of functions from which to pull

## pickRestart

Similar to `pick`, but the choosen pattern is restarted when its index is triggered.

- pat (Pattern):
- xs (\*):

## pickmodRestart

The same as `pickRestart`, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.

- pat (Pattern):
- xs (\*):

9

1

2

3

4

5

6

"<a@2 b@2 c@2 d@2>".pickRestart({

a:n("0 1 2 0"),

b:n("2 3 4 ~"),

c:n("\[4 5\] \[4 3\] 2 0"),

d:n("0 -3 0 ~")

}).scale("C:major").s("piano")

## pickReset

Similar to `pick`, but the choosen pattern is reset when its index is triggered.

- pat (Pattern):
- xs (\*):

## pickmodReset

The same as `pickReset`, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.

- pat (Pattern):
- xs (\*):

## inhabit

Synonyms: `pickSqueeze`

Picks patterns (or plain values) either from a list (by index) or a lookup table (by name).
Similar to `pick`, but cycles are squeezed into the target ('inhabited') pattern.

- pat (Pattern):
- xs (\*):

9

1

2

3

leta=s("bd(3,8)")

letb=s("cp sd")

"<a b \[a,b\]>".inhabit({a,b})

9

1

2

3

s("a@2 \[a b\] a"

.inhabit({a:"bd(3,8)",b:"sd sd"}))

.slow(4)

## inhabitmod

Synonyms: `pickmodSqueeze`

The same as `inhabit`, but if you pick a number greater than the size of the list,
it wraps around, rather than sticking at the maximum value.
For example, if you pick the fifth pattern of a list of three, you'll get the
second one.

- pat (Pattern):
- xs (\*):

## squeeze

Pick from the list of values (or patterns of values) via the index using the given
pattern of integers. The selected pattern will be compressed to fit the duration of the selecting event

- pat (Pattern):
- xs (\*):

9

1

note(squeeze("<0@2 \[1!2\] 2>",\["g a","f g f g","g a c d"\]))

After Conditional Modifiers, let’s see what [Accumulation Modifiers](https://strudel.cc/learn/accumulation/) have to offer.