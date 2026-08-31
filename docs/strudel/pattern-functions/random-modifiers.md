# RANDOM MODIFIERS
Source: https://strudel.cc/learn/random-modifiers/
Category: pattern-functions

# Random Modifiers

These methods add random behavior to your Patterns.

## choose

Chooses randomly from the given list of elements.

- xs (any): values / patterns to choose from.

9

1

note("c2 g2!2 d2 f1").s(choose("sine","triangle","bd:6"))

## wchoose

Chooses randomly from the given list of elements by giving a probability to each element

- pairs (any): arrays of value and weight

9

1

note("c2 g2!2 d2 f1").s(wchoose(\["sine",10\],\["triangle",1\],\["bd:6",1\]))

## chooseCycles

Synonyms: `randcat`

Picks one of the elements at random each cycle.

9

1

chooseCycles("bd","hh","sd").s().fast(8)

9

1

s("bd \| hh \| sd").fast(8)

## wchooseCycles

Synonyms: `wrandcat`

Picks one of the elements at random each cycle by giving a probability to each element

9

1

wchooseCycles(\["bd",10\],\["hh",1\],\["sd",1\]).s().fast(8)

9

1

wchooseCycles(\["c c c",5\],\["a a a",3\],\["f f f",1\]).fast(4).note()

9

1

2

// The probability can itself be a pattern

wchooseCycles(\["bd(3,8)","<5 0>"\],\["hh hh hh",3\]).fast(4).s()

## degradeBy

Randomly removes events from the pattern by a given amount.
0 = 0% chance of removal
1 = 100% chance of removal

- amount (number): a number between 0 and 1

9

1

s("hh\*8").degradeBy(0.2)

9

1

s("\[hh?0.2\]\*8")

9

1

2

//beat generator

s("bd").segment(16).degradeBy(.5).ribbon(16,1)

## degrade

Randomly removes 50% of events from the pattern. Shorthand for `.degradeBy(0.5)`

9

1

s("hh\*8").degrade()

9

1

s("\[hh?\]\*8")

## undegradeBy

Inverse of `degradeBy`: Randomly removes events from the pattern by a given amount.
0 = 100% chance of removal
1 = 0% chance of removal
Events that would be removed by degradeBy are let through by undegradeBy and vice versa (see second example).

- amount (number): a number between 0 and 1

9

1

s("hh\*8").undegradeBy(0.2)

9

1

2

3

4

s("hh\*10").layer(

x=>x.degradeBy(0.2).pan(0),

x=>x.undegradeBy(0.8).pan(1)

)

## undegrade

Inverse of `degrade`: Randomly removes 50% of events from the pattern. Shorthand for `.undegradeBy(0.5)`
Events that would be removed by degrade are let through by undegrade and vice versa (see second example).

9

1

s("hh\*8").undegrade()

9

1

2

3

4

s("hh\*10").layer(

x=>x.degrade().pan(0),

x=>x.undegrade().pan(1)

)

## sometimesBy

Randomly applies the given function by the given probability.
Similar to `someCyclesBy`

- probability (number\|Pattern): a number between 0 and 1
- function (function): the transformation to apply

9

1

s("hh\*8").sometimesBy(.4,x=>x.speed("0.5"))

## sometimes

Applies the given function with a 50% chance

- function (function): the transformation to apply

9

1

s("hh\*8").sometimes(x=>x.speed("0.5"))

## someCyclesBy

Randomly applies the given function by the given probability on a cycle by cycle basis.
Similar to `sometimesBy`

- probability (number\|Pattern): a number between 0 and 1
- function (function): the transformation to apply

9

1

s("bd,hh\*8").someCyclesBy(.3,x=>x.speed("0.5"))

## someCycles

Shorthand for `.someCyclesBy(0.5, fn)`

9

1

s("bd,hh\*8").someCycles(x=>x.speed("0.5"))

## often

Shorthand for `.sometimesBy(0.75, fn)`

9

1

s("hh\*8").often(x=>x.speed("0.5"))

## rarely

Shorthand for `.sometimesBy(0.25, fn)`

9

1

s("hh\*8").rarely(x=>x.speed("0.5"))

## almostNever

Shorthand for `.sometimesBy(0.1, fn)`

9

1

s("hh\*8").almostNever(x=>x.speed("0.5"))

## almostAlways

Shorthand for `.sometimesBy(0.9, fn)`

9

1

s("hh\*8").almostAlways(x=>x.speed("0.5"))

## never

Shorthand for `.sometimesBy(0, fn)` (never calls fn)

9

1

s("hh\*8").never(x=>x.speed("0.5"))

## always

Shorthand for `.sometimesBy(1, fn)` (always calls fn)

9

1

s("hh\*8").always(x=>x.speed("0.5"))

Next up: [Conditional Modifiers](https://strudel.cc/learn/conditional-modifiers/)