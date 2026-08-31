# ꩜  strudelDOCS

Press `/` to search

[go to REPL](https://strudel.cc/)

Open main menu

- ## Presentation



  - [What is Strudel?](https://strudel.cc/workshop/getting-started/)
  - [Showcase](https://strudel.cc/intro/showcase/)
  - [Blog](https://strudel.cc/blog/)

- ## Workshop



  - [First Sounds](https://strudel.cc/workshop/first-sounds/)
  - [First Notes](https://strudel.cc/workshop/first-notes/)
  - [First Effects](https://strudel.cc/workshop/first-effects/)
  - [Pattern Effects](https://strudel.cc/workshop/pattern-effects/)
  - [Recap](https://strudel.cc/workshop/recap/)
  - [Workshop in German](https://strudel.cc/de/workshop/getting-started/)

- ## Making Sound



  - [Samples](https://strudel.cc/learn/samples/)
  - [Synths](https://strudel.cc/learn/synths/)
  - [Audio Effects](https://strudel.cc/learn/effects/)
  - [MIDI & OSC](https://strudel.cc/learn/input-output/)

- ## More



  - [FAQ](https://strudel.cc/learn/faq/)
  - [Recipes](https://strudel.cc/recipes/recipes/)
  - [Mini-Notation](https://strudel.cc/learn/mini-notation/)
  - [Visual Feedback](https://strudel.cc/learn/visual-feedback/)
  - [Offline](https://strudel.cc/learn/pwa/)
  - [Patterns](https://strudel.cc/technical-manual/patterns/)
  - [Mondo Notation](https://strudel.cc/learn/mondo-notation/)
  - [Music metadata](https://strudel.cc/learn/metadata/)
  - [CSound](https://strudel.cc/learn/csound/)
  - [Hydra](https://strudel.cc/learn/hydra/)
  - [Input Devices](https://strudel.cc/learn/input-devices/)
  - [Device Motion](https://strudel.cc/learn/devicemotion/)

- ## Pattern Functions



  - [Introduction](https://strudel.cc/functions/intro/)
  - [Creating Patterns](https://strudel.cc/learn/factories/)
  - [Time Modifiers](https://strudel.cc/learn/time-modifiers/)
  - [Control Parameters](https://strudel.cc/functions/value-modifiers/)
  - [Signals](https://strudel.cc/learn/signals/)
  - [Random Modifiers](https://strudel.cc/learn/random-modifiers/)
  - [Conditional Modifiers](https://strudel.cc/learn/conditional-modifiers/)
  - [Accumulation](https://strudel.cc/learn/accumulation/)
  - [LFOs](https://strudel.cc/learn/lfo/)
  - [Tonal Functions](https://strudel.cc/learn/tonal/)
  - [Stepwise Functions](https://strudel.cc/learn/stepwise/)

- ## Understand



  - [Coding syntax](https://strudel.cc/learn/code/)
  - [Pitch](https://strudel.cc/understand/pitch/)
  - [Xenharmonic Functions](https://strudel.cc/learn/xen/)
  - [Cycles](https://strudel.cc/understand/cycles/)
  - [Voicings](https://strudel.cc/understand/voicings/)
  - [Pattern Alignment](https://strudel.cc/technical-manual/alignment/)
  - [Strudel vs Tidal](https://strudel.cc/learn/strudel-vs-tidal/)

- ## Development



  - [Strudel in your Project](https://strudel.cc/technical-manual/project-start/)
  - [Packages](https://strudel.cc/technical-manual/packages/)
  - [REPL](https://strudel.cc/technical-manual/repl/)
  - [Sounds](https://strudel.cc/technical-manual/sounds/)
  - [Docs](https://strudel.cc/technical-manual/docs/)
  - [Testing](https://strudel.cc/technical-manual/testing/)

# Welcome

![Strudel Icon](https://strudel.cc/icons/strudel_icon.png)

Welcome to the Strudel documentation pages!
You’ve come to the right place if you want to learn how to make music with code.

## What is Strudel?

With Strudel, you can expressively write dynamic music pieces.

It is an official port of the [Tidal Cycles](https://tidalcycles.org/) pattern language to JavaScript.

You don’t need to know JavaScript or Tidal Cycles to make music with Strudel.
This interactive tutorial will guide you through the basics of Strudel.

The best place to actually make music with Strudel is the [Strudel REPL](https://strudel.cc/)

## What can you do with Strudel?

- live code music: make music with code in real time
- algorithmic composition: compose music using tidal’s unique approach to pattern manipulation
- teaching: focussing on a low barrier of entry, Strudel is a good fit for teaching music and code at the same time.
- integrate into your existing music setup: either via MIDI or OSC, you can use Strudel as a really flexible sequencer

## Examples

Here are some examples of how strudel can sound:

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

20

21

22

23

24

25

26

27

28

29

30

// "coastline" @by eddyflux

// @version 1.0

samples('github:eddyflux/crate')

setcps(.75)

letchords=chord("<Bbm9 Fm9>/4").dict('ireal')

stack(

stack(// DRUMS

s("bd").struct("<\[x\*<1 2> \[~@3 x\]\] x>"),

s("~ \[rim, sd:<2 3>\]").room("<0 .2>"),

n("\[0 <1 3>\]\*<2!3 4>").s("hh"),

s("rd:<1!3 2>\*2").mask("<0 0 1 1>/16").gain(.5)

).bank('crate')

.mask("<\[0 1\] 1 1 1>/16".early(.5))

,// CHORDS

chords.offset(-1).voicing().s("gm\_epiano1:1")

.phaser(4).room(.5)

,// MELODY

n("<0!3 1\*2>").set(chords).mode("root:g2")

.voicing().s("gm\_acoustic\_bass"),

chords.n("\[0 <4 3 <2 5>>\*2\](<3 5>,8)")

.anchor("D5").voicing()

.segment(4).clip(rand.range(.4,.8))

.room(.75).shape(.3).delay(.25)

.fm(sine.range(3,8).slow(8))

.lpf(sine.range(500,1000).slow(8)).lpq(5)

.rarely(ply("2")).chunk(4,fast(2))

.gain(perlin.range(.6,.9))

.mask("<0 1 1 0>/16")

)

.late("\[0 .01\]\*4").late("\[0 .01\]\*2").size(4)

These examples cannot fully encompass the variety of things you can do, so [check out the showcase](https://strudel.cc/intro/showcase/) for some videos of how people use Strudel.

## Getting Started

The best way to start learning Strudel is the workshop.
If you’re ready to dive in, let’s start with your [first sounds](https://strudel.cc/workshop/first-sounds/)

- [Edit this page](https://codeberg.org/uzu/strudel/src/branch/main/website/src/pages/workshop/getting-started.mdx)
- [Join our community](https://discord.com/invite/HGEdXmRkzT)
- [@strudel on Mastodon](https://social.toplap.org/@strudel)

- [Welcome](https://strudel.cc/workshop/getting-started/#welcome)
- [What is Strudel?](https://strudel.cc/workshop/getting-started/#what-is-strudel)
- [What can you do with Strudel?](https://strudel.cc/workshop/getting-started/#what-can-you-do-with-strudel)
- [Examples](https://strudel.cc/workshop/getting-started/#examples)
- [Getting Started](https://strudel.cc/workshop/getting-started/#getting-started)

- [Edit this page](https://codeberg.org/uzu/strudel/src/branch/main/website/src/pages/workshop/getting-started.mdx)
- [Join our community](https://discord.com/invite/HGEdXmRkzT)
- [@strudel on Mastodon](https://social.toplap.org/@strudel)