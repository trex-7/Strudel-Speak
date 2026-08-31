# FIRST NOTES
Source: https://strudel.cc/workshop/first-notes/
Category: workshop

# First Notes

Let’s look at how we can play notes

## numbers and notes

**play notes with numbers**

```
note("48 52 55 59").sound("piano")
```

Try out different numbers!

Try decimal numbers, like 55.5

**play notes with letters**

```
note("c e g b").sound("piano")
```

Try out different letters (a - g).

Can you find melodies that are actual words? Hint: ☕ 😉 ⚪

**add flats or sharps to play the black keys**

```
note("db eb gb ab bb").sound("piano")
```

```
note("c# d# f# g# a#").sound("piano")
```

**play notes with letters in different octaves**

```
note("c2 e3 g4 b5").sound("piano")
```

Try out different octaves (1-8)

If you are not comfortable with the note letter system, it should be easier to use numbers instead.
Most of the examples below will use numbers for that reason.
We will also look at ways to make it easier to play the right notes later.

## changing the sound

Just like with unpitched sounds, we can change the sound of our notes with `sound`:

```
note("36 43, 52 59 62 64").sound("piano")
```

Try out different sounds:

- gm\_electric\_guitar\_muted
- gm\_acoustic\_bass
- gm\_voice\_oohs
- gm\_blown\_bottle
- sawtooth
- square
- triangle
- how about bd, sd or hh?
- remove `.sound('...')` completely

**switch between sounds**

```
note("48 67 63 [62, 58]")
.sound("piano gm_electric_guitar_muted")
```

**stack multiple sounds**

```
note("48 67 63 [62, 58]")
.sound("piano, gm_electric_guitar_muted")
```

The `note` and `sound` patterns are combined!

We will see more ways to combine patterns later..

## Longer Sequences

**Divide sequences with `/` to slow them down**

```
note("[36 34 41 39]/4").sound("gm_acoustic_bass")
```

The `/4` plays the sequence in brackets over 4 cycles (=8s).

So each of the 4 notes is 2s long.

Try adding more notes inside the brackets and notice how it gets faster.

**Play one per cycle with `< ... >`**

In the last section, we learned that `< ... >` (angle brackets) can be used to play only one thing per cycle,
which is useful for longer melodies too:

```
note("<36 34 41 39>").sound("gm_acoustic_bass")
```

Try adding more notes inside the brackets and notice how the tempo stays the same.

The angle brackets are actually just a shortcut:

`<a b c>` = `[a b c]/3`

`<a b c d>` = `[a b c d]/4`

…

**Play one sequence per cycle**

We can combine the 2 types of brackets in all sorts of different ways.
Here is an example of a repetitive bassline:

```
note("<[36 48]*4 [34 46]*4 [41 53]*4 [39 51]*4>")
.sound("gm_acoustic_bass")
```

**Alternate between multiple things**

```
note("60 <63 62 65 63>")
.sound("gm_xylophone")
```

This is also useful for unpitched sounds:

```
sound("bd*4, [~ <sd cp>]*2, [~ hh]*4")
.bank("RolandTR909")
```

## Scales

Finding the right notes can be difficult.. Scales are here to help:

```
setcpm(60)
n("0 2 4 <[6,8] [7,9]>")
.scale("C:minor").sound("piano")
```

Try out different numbers. Any number should sound good!

Try out different scales:

- C:major
- A2:minor
- D:dorian
- G:mixolydian
- A2:minor:pentatonic
- F:major:pentatonic

**automate scales**

Just like anything, we can automate the scale with a pattern:

```
setcpm(60)
n("<0 -3>, 2 4 <[6,8] [7,9]>")
.scale("<C:major D:mixolydian>/4")
.sound("piano")
```

If you have no idea what these scale mean, don’t worry.
These are just labels for different sets of notes that go well together.

Take your time and you’ll find scales you like!

## Repeat & Elongate

**Elongate with @**

```
note("c@3 eb").sound("gm_acoustic_bass")
```

Not using `@` is like using `@1`. In the above example, c is 3 units long and eb is 1 unit long.

Try changing that number!

**Elongate within sub-sequences**

```
setcpm(60)
n("<[4@2 4] [5@2 5] [6@2 6] [5@2 5]>*2")
.scale("<C2:mixolydian F2:mixolydian>/4")
.sound("gm_acoustic_bass")
```

This groove is called a `shuffle`.
Each beat has two notes, where the first is twice as long as the second.
This is also sometimes called triplet swing. You’ll often find it in blues and jazz.

**Replicate**

```
setcpm(60)
note("c!2 [eb,<g a bb a>]").sound("piano")
```

Try switching between `!`, `*` and `@`

What’s the difference?

## Recap

Let’s recap what we’ve learned in this chapter:

| Concept | Syntax | Example |
| --- | --- | --- |
| Slow down | / | ```<br>note("[c a f e]/2")<br>``` |
| Alternate | <> | ```<br>note("c a f <e g>")<br>``` |
| Elongate | @ | ```<br>note("c@3 e")<br>``` |
| Replicate | ! | ```<br>note("c!3 e")<br>``` |

New functions:

| Name | Description | Example |
| --- | --- | --- |
| note | set pitch as number or letter | ```<br>note("b g e c").sound("piano")<br>``` |
| scale | interpret `n` as scale degree | ```<br>n("6 4 2 0").scale("C:minor").sound("piano")<br>``` |
| $: | play patterns in parallel | ```<br>$: s("bd sd")<br>$: note("c eb g")<br>``` |

## Examples

**Classy Bassline**

```
note("<[c2 c3]*4 [bb1 bb2]*4 [f2 f3]*4 [eb2 eb3]*4>")
.sound("gm_synth_bass_1")
.lpf(800) // <-- we'll learn about this soon
```

**Classy Melody**

```
n(`<
[~ 0] 2 [0 2] [~ 2]
[~ 0] 1 [0 1] [~ 1]
[~ 0] 3 [0 3] [~ 3]
[~ 0] 2 [0 2] [~ 2]
>*4`).scale("C4:minor")
.sound("gm_synth_strings_1")
```

**Classy Drums**

```
sound("bd*4, [~ <sd cp>]*2, [~ hh]*4")
.bank("RolandTR909")
```

**If there just was a way to play all the above at the same time…**

You can use `$:` 😙

## Playing multiple patterns

If you want to play multiple patterns at the same time, make sure to write `$:` before each:

```
$: note("<[c2 c3]*4 [bb1 bb2]*4 [f2 f3]*4 [eb2 eb3]*4>")
.sound("gm_synth_bass_1").lpf(800)

$: n(`<
[~ 0] 2 [0 2] [~ 2]
[~ 0] 1 [0 1] [~ 1]
[~ 0] 3 [0 3] [~ 3]
[~ 0] 2 [0 2] [~ 2]
>*4`).scale("C4:minor")
.sound("gm_synth_strings_1")

$: sound("bd*4, [~ <sd cp>]*2, [~ hh]*4")
.bank("RolandTR909")
```

Try changing `$` to `_$` to mute a part!

This is starting to sound like actual music! We have sounds, we have notes, now the last piece of the puzzle is missing: [effects](https://strudel.cc/workshop/first-effects/)