# INTRO
Source: https://strudel.cc/functions/intro/
Category: pattern-functions

# Pattern Functions

Let’s learn all about functions to create and modify patterns.
At the core of Strudel, everything is made of functions.

For example, everything you can do with the Mini-Notation can also be done with a function.
This Pattern in Mini Notation:

9

1

note("c3 eb3 g3")

is equivalent to this Pattern without Mini Notation:

9

1

note(seq("c3","eb3","g3"))

Similarly, there is an equivalent function for every aspect of the mini notation.

Which representation to use is a matter of context. As a rule of thumb, functions
are better suited in a larger context, while mini notation is more practical for individual rhythms.

## Limits of Mini Notation

While the Mini Notation is a powerful way to write rhythms concisely, it also has its limits. Take this example:

9

1

2

3

4

stack(

note("c2 eb2(3,8)").s('sawtooth').cutoff(800),

s("bd(5,8), hh\*8")

)

Here, we are using mini notation for the individual rhythms, while using the function `stack` to mix them.
While stack is also available as `,` in mini notation, we cannot use it here, because we have different types of sounds.

## Combining Patterns

You can freely mix JS patterns, mini patterns and values! For example, this pattern:

9

1

2

3

4

5

6

cat(

stack("g3","b3","e4"),

stack("a3","c3","e4"),

stack("b3","d3","fs4"),

stack("b3","e4","g4")

).note()

…is equivalent to:

9

1

2

3

4

5

6

cat(

"g3,b3,e4",

"a3,c3,e4",

"b3,d3,f#4",

"b3,e4,g4"

).note()

… as well as:

9

1

note("<\[g3,b3,e4\] \[a3,c3,e4\] \[b3,d3,f#4\] \[b3,e4,g4\]>")

While mini notation is almost always shorter, it only has a handful of modifiers: \* / ! @.
When using JS patterns, there is a lot more you can do.

Next, let’s look at how you can [create patterns](https://strudel.cc/learn/factories/)