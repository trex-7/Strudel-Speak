# RECAP
Source: https://strudel.cc/workshop/recap/
Category: workshop

# Workshop Recap

This page is just a listing of all functions covered in the workshop!

## Mini Notation

| Concept | Syntax | Example |
| --- | --- | --- |
| Sequence | space | ```<br>sound("bd bd sd hh bd cp sd hh")<br>``` |
| Sample Number | :x | ```<br>sound("hh:0 hh:1 hh:2 hh:3")<br>``` |
| Rests | ~ | ```<br>sound("metal ~ jazz jazz:1")<br>``` |
| Sub-Sequences | \[\] | ```<br>sound("bd wind [metal jazz] hh")<br>``` |
| Sub-Sub-Sequences | \[\[\]\] | ```<br>sound("bd [metal [jazz sd]]")<br>``` |
| Speed up | \* | ```<br>sound("bd sd*2 cp*3")<br>``` |
| Parallel | , | ```<br>sound("bd*2, hh*2 [hh oh]")<br>``` |
| Slow down | / | ```<br>note("[c a f e]/2")<br>``` |
| Alternate | <> | ```<br>note("c <e g>")<br>``` |
| Elongate | @ | ```<br>note("c@3 e")<br>``` |
| Replicate | ! | ```<br>note("c!3 e")<br>``` |

## Sounds

| Name | Description | Example |
| --- | --- | --- |
| sound | plays the sound of the given name | ```<br>sound("bd sd")<br>``` |
| bank | selects the sound bank | ```<br>sound("bd sd").bank("RolandTR909")<br>``` |
| n | select sample number | ```<br>n("0 1 4 2").sound("jazz")<br>``` |

## Notes

| Name | Description | Example |
| --- | --- | --- |
| note | set pitch as number or letter | ```<br>note("b g e c").sound("piano")<br>``` |
| n + scale | set note in scale | ```<br>n("6 4 2 0").scale("C:minor").sound("piano")<br>``` |
| $: | play patterns in parallel | ```<br>$: s("bd sd")<br>$: note("c eb g")<br>``` |

## Audio Effects

| name | example |
| --- | --- |
| lpf | ```<br>note("c2 c3 c2 c3").s("sawtooth").lpf("400 2000")<br>``` |
| vowel | ```<br>note("c3 eb3 g3").s("sawtooth").vowel("<a e i o>")<br>``` |
| gain | ```<br>s("hh*16").gain("[.25 1]*4")<br>``` |
| delay | ```<br>s("bd rim bd cp").delay(.5)<br>``` |
| room | ```<br>s("bd rim bd cp").room(.5)<br>``` |
| pan | ```<br>s("bd rim bd cp").pan("0 1")<br>``` |
| speed | ```<br>s("bd rim bd cp").speed("<1 2 -1 -2>")<br>``` |
| range | ```<br>s("hh*32").lpf(saw.range(200,4000))<br>``` |

## Pattern Effects

| name | description | example |
| --- | --- | --- |
| setcpm | sets the tempo in cycles per minute | ```<br>setcpm(45); sound("bd sd [~ bd] sd")<br>``` |
| fast | speed up | ```<br>sound("bd sd [~ bd] sd").fast(2)<br>``` |
| slow | slow down | ```<br>sound("bd sd [~ bd] sd").slow(2)<br>``` |
| rev | reverse | ```<br>n("0 2 4 6").scale("C:minor").rev()<br>``` |
| jux | split left/right, modify right | ```<br>n("0 2 4 6").scale("C:minor").jux(rev)<br>``` |
| add | add numbers / notes | ```<br>n("0 2 4 6".add("<0 1 2 1>")).scale("C:minor")<br>``` |
| ply | speed up each event n times | ```<br>s("bd sd").ply("<1 2 3>")<br>``` |
| off | copy, shift time & modify | ```<br>s("bd sd, hh*4").off(1/8, x=>x.speed(2))<br>``` |