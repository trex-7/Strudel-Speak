# ACCUMULATION
Source: https://strudel.cc/learn/accumulation/
Category: pattern-functions

# Accumulation Modifiers

## superimpose

Superimposes the result of the given function(s) on top of the original pattern:

9

1

2

3

"<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>\*8"

.superimpose(x=>x.add(2))

.scale('C minor').note()

## layer

Layers the result of the given function(s). Like `superimpose`, but without the original pattern:

9

1

2

3

"<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>\*8"

.layer(x=>x.add("0,2"))

.scale('C minor').note()

## off

Superimposes the function result on top of the original pattern, delayed by the given time.

- time (Pattern\|number): offset time
- func (function): function to apply

9

1

"c3 eb3 g3".off(1/8,x=>x.add(7)).note()

## echo

Superimpose and offset multiple times, gradually decreasing the velocity

- times (number): how many times to repeat
- time (number): cycle offset between iterations
- feedback (number): velocity multiplicator for each iteration

9

1

s("bd sd").echo(3,1/6,.8)

## echoWith

Synonyms: `echowith, stutWith, stutwith`

Superimpose and offset multiple times, applying the given function each time.

- times (number): how many times to repeat
- time (number): cycle offset between iterations
- func (function): function to apply, given the pattern and the iteration index

9

1

2

3

"<0 \[2 4\]>"

.echoWith(4,1/8,(p,n)=>p.add(n\*2))

.scale("C:minor").note()

## stut

Deprecated. Like echo, but the last 2 parameters are flipped.

- times (number): how many times to repeat
- feedback (number): velocity multiplicator for each iteration
- time (number): cycle offset between iterations

9

1

s("bd sd").stut(3,.8,1/6)

There are also [Tonal Functions](https://strudel.cc/learn/tonal/).