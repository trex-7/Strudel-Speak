# STEPWISE FUNCTIONS
Source: https://strudel.cc/learn/stepwise/
Category: pattern-functions

# Stepwise patterning (experimental)

This is a developing area of strudel, and behaviour might change or be renamed in future versions. Feedback and ideas are welcome!

## Introduction

Usually in strudel, the only reference point for most pattern transformations is the _cycle_. Now it is possible to also work with _steps_, via a growing range of functions.

For example usually when you `fastcat` two patterns together, the cycles will be squashed into half a cycle each:

```
fastcat("bd hh hh", "bd hh hh cp hh").sound()
```

With the new stepwise `stepcat` function, the steps of the two patterns will be evenly distributed across the cycle:

```
stepcat("bd hh hh", "bd hh hh cp hh").sound()
```

By default, steps are counted according to the ‘top level’ in mini-notation. For example `"a [b c] d e"` has five events in it per cycle, but is counted as four steps, where `[b c]` is counted as a single step.

However, you can mark a different metrical level to count steps relative to, using a `^` at the start of a sub-pattern. If we do this to the subpattern in our example: `"a [^b c] d e"`, then the pattern is now counted as having _eight_ steps. This is because ‘b’ and ‘c’ are each counted as single steps, and the events in the pattern are twice as long, and so counted as two steps each.

## Pacing the steps

Some stepwise functions don’t appear to do very much on their own, for example these two examples of the `expand` function sound exactly the same despite being expanded by different amounts:

```
"c a f e".expand(2).note().sound("folkharp")
```

```
"c a f e".expand(4).note().sound("folkharp")
```

The number of steps per cycle is being changed behind the scenes, but on its own, that doesn’t do anything. You will hear a difference however, once you use another stepwise function with it, for example `stepcat`:

```
stepcat("c a f e".expand(2), "g d").note()
.sound("folkharp")
```

```
stepcat("c a f e".expand(4), "g d").note()
.sound("folkharp")
```

You should be able to hear that `expand` increases the duration of the steps of the first subpattern, proportionally to the second one.

You can also change the speed of a pattern to match a given number of steps per cycle, with the `pace` function:

```
stepcat("c a f e".expand(2), "g d").note()
.sound("folkharp")
.pace(8)
```

```
stepcat("c a f e".expand(4), "g d").note()
.sound("folkharp")
.pace(8)
```

The first example has ten steps, and the second example has 18 steps, but are then both played a rate of 8 steps per cycle.

The argument to `expand` can also be patterned, and will be treated in a stepwise fashion. This means that the patterns from the changing values in the argument will be `stepcat`ted together:

```
note("c a f e").sound("folkharp").expand("3 2 1 1 2 3")
```

This results in a dense pattern, because the different expanded versions are squashed into a single cycle. `pace` is again handy here for slowing down the pattern to a particular number of steps per cycle:

```
note("c a f e").sound("folkharp").expand("3 2 1 1 2 3").pace(8)
```

Earlier versions of many of these functions had `s_` prefixes, and the `pace` function was previously known as `steps`. These still exist as aliases, but may have changed behaviour and will soon be removed. Please update your patterns!

## Stepwise functions

### pace

_Experimental_

Speeds a pattern up or down, to fit to the given number of steps per cycle.

```
sound("bd sd cp").pace(4)
// The same as sound("{bd sd cp}%4") or sound("<bd sd cp>*4")
```

### stepcat

Synonyms: `timeCat, timecat`

'Concatenates' patterns like `fastcat`, but proportional to a number of steps per cycle.
The steps can either be inferred from the pattern, or provided as a \[length, pattern\] pair.
Has the alias `timecat`.

```
stepcat([3,"e3"],[1, "g3"]).note()
// the same as "e3@3 g3".note()
```

```
stepcat("bd sd cp","hh hh").sound()
// the same as "bd sd cp hh hh".sound()
```

### stepalt

_Experimental_

Concatenates patterns stepwise, according to an inferred 'steps per cycle'.
Similar to `stepcat`, but if an argument is a list, the whole pattern will alternate between the elements in the list.

```
stepalt(["bd cp", "mt"], "bd").sound()
// The same as "bd cp bd mt bd".sound()
```

### expand

_Experimental_

Expands the step size of the pattern by the given factor.

```
sound("tha dhi thom nam").bank("mridangam").expand("3 2 1 1 2 3").pace(8)
```

### contract

_Experimental_

Contracts the step size of the pattern by the given factor. See also `expand`.

```
sound("tha dhi thom nam").bank("mridangam").contract("3 2 1 1 2 3").pace(8)
```

### extend

_Experimental_

`extend` is similar to `fast` in that it increases its density, but it also increases the step count
accordingly. So `stepcat("a b".extend(2), "c d")` would be the same as `"a b a b c d"`, whereas
`stepcat("a b".fast(2), "c d")` would be the same as `"[a b] [a b] c d"`.

```
stepcat(
  sound("bd bd - cp").extend(2),
  sound("bd - sd -")
).pace(8)
```

### take

_Experimental_

Takes the given number of steps from a pattern (dropping the rest).
A positive number will take steps from the start of a pattern, and a negative number from the end.

```
"bd cp ht mt".take("2").sound()
// The same as "bd cp".sound()
```

```
"bd cp ht mt".take("1 2 3").sound()
// The same as "bd bd cp bd cp ht".sound()
```

```
"bd cp ht mt".take("-1 -2 -3").sound()
// The same as "mt ht mt cp ht mt".sound()
```

### drop

_Experimental_

Drops the given number of steps from a pattern.
A positive number will drop steps from the start of a pattern, and a negative number from the end.

```
"tha dhi thom nam".drop("1").sound().bank("mridangam")
```

```
"tha dhi thom nam".drop("-1").sound().bank("mridangam")
```

```
"tha dhi thom nam".drop("0 1 2 3").sound().bank("mridangam")
```

```
"tha dhi thom nam".drop("0 -1 -2 -3").sound().bank("mridangam")
```

### polymeter

Synonyms: `pm`

_Experimental_

Aligns the steps of the patterns, creating polymeters. The patterns are repeated until they all fit the cycle. For example, in the below the first pattern is repeated twice, and the second is repeated three times, to fit the lowest common multiple of six steps.

```
// The same as note("{c eb g, c2 g2}%6")
polymeter("c eb g", "c2 g2").note()
```

### shrink

_Experimental_

Progressively shrinks the pattern by 'n' steps until there's nothing left, or if a second value is given (using mininotation list syntax with `:`),
that number of times.
A positive number will progressively drop steps from the start of a pattern, and a negative number from the end.

```
"tha dhi thom nam".shrink("1").sound()
.bank("mridangam")
```

```
"tha dhi thom nam".shrink("-1").sound()
.bank("mridangam")
```

```
"tha dhi thom nam".shrink("1 -1").sound().bank("mridangam").pace(4)
```

```
note("0 1 2 3 4 5 6 7".scale("C:ritusen")).sound("folkharp")
   .shrink("1 -1").pace(8)
```

### grow

_Experimental_

Progressively grows the pattern by 'n' steps until the full pattern is played, or if a second value is given (using mininotation list syntax with `:`),
that number of times.
A positive number will progressively grow steps from the start of a pattern, and a negative number from the end.

```
"tha dhi thom nam".grow("1").sound()
.bank("mridangam")
```

```
"tha dhi thom nam".grow("-1").sound()
.bank("mridangam")
```

```
"tha dhi thom nam".grow("1 -1").sound().bank("mridangam").pace(4)
```

```
note("0 1 2 3 4 5 6 7".scale("C:ritusen")).sound("folkharp")
   .grow("1 -1").pace(8)
```

### tour

_Experimental_

Inserts a pattern into a list of patterns. On the first repetition it will be inserted at the end of the list, then moved backwards through the list
on successive repetitions. The patterns are added together stepwise, with all repetitions taking place over a single cycle. Using `pace` to set the
number of steps per cycle is therefore usually recommended.

```
"[c g]".tour("e f", "e f g", "g f e c").note()
   .sound("folkharp")
   .pace(8)
```

### zip

_Experimental_

'zips' together the steps of the provided patterns. This can create a long repetition, taking place over a single, dense cycle.
Using `pace` to set the number of steps per cycle is therefore usually recommended.

```
zip("e f", "e f g", "g [f e] a f4 c").note()
   .sound("folkharp")
   .pace(8)
```