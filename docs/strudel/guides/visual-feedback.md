# VISUAL FEEDBACK
Source: https://strudel.cc/learn/visual-feedback/
Category: guides

# Visual Feedback

There are several function that add visual feedback to your patterns.

## Mini Notation Highlighting

When you write mini notation with “double quotes” or \`backticks\`, the active parts of the mini notation will be highlighted:

```
n("<0 2 1 3 2>*8")
.scale("<A1 D2>/4:minor:pentatonic")
.s("supersaw").lpf(300).lpenv("<4 3 2>*4")
```

You can change the color as well, even pattern it:

```
n("<0 2 1 3 2>*8")
.scale("<A1 D2>/4:minor:pentatonic")
.s("supersaw").lpf(300).lpenv("<4 3 2>*4")
.color("cyan magenta")
```

## Global vs Inline Visuals

The following functions all come with in 2 variants.

**Without prefix**: renders the visual to the background of the page:

```
note("c a f e").color("white").punchcard()
```

**With `_` prefix**: renders the visual inside the code. Allows for multiple visuals

```
note("c a f e").color("white")._punchcard()
```

Here we see the 2 variants for `punchcard`. The same goes for all others below.
To improve readability the following demos will all use the inline variant.

## Punchcard / Pianoroll

These 2 functions render a pianoroll style visual.
The only difference between the 2 is that `pianoroll` will render the pattern directly,
while `punchcard` will also take the transformations into account that occur afterwards:

```
note("c a f e").color("white")
._punchcard()
.color("cyan")
```

Here, the `color` is still visible in the visual, even if it is applied after `_punchcard`.
On the contrary, the color is not visible when using `_pianoroll`:

```
note("c a f e").color("white")
._pianoroll()
.color("cyan")
```

`punchcard` is less resource intensive because it uses the same data as used for the mini notation highlighting.

The visual can be customized by passing options. Those options are the same for both functions.

What follows is the API doc of all the options you can pass:

Synonyms: `punchcard`

Visualises a pattern as a scrolling 'pianoroll', displayed in the background of the editor. To show a pianoroll for all running patterns, use `all(pianoroll)`. To have a pianoroll appear below
a pattern instead, prefix with `_`, e.g.: `sound("bd sd")._pianoroll()`.

- options (Object): Object containing all the optional following parameters as key value pairs:
- cycles (integer): number of cycles to be displayed at the same time - defaults to 4
- playhead (number): location of the active notes on the time axis - 0 to 1, defaults to 0.5
- vertical (boolean): displays the roll vertically - 0 by default
- labels (boolean): displays labels on individual notes (see the label function) - 0 by default
- flipTime (boolean): reverse the direction of the roll - 0 by default
- flipValues (boolean): reverse the relative location of notes on the value axis - 0 by default
- overscan (number): lookup X cycles outside of the cycles window to display notes in advance - 1 by default
- hideNegative (boolean): hide notes with negative time (before starting playing the pattern) - 0 by default
- smear (boolean): notes leave a solid trace - 0 by default
- fold (boolean): notes takes the full value axis width - 0 by default
- active (string): hexadecimal or CSS color of the active notes - defaults to #FFCA28
- inactive (string): hexadecimal or CSS color of the inactive notes - defaults to #7491D2
- background (string): hexadecimal or CSS color of the background - defaults to transparent
- playheadColor (string): hexadecimal or CSS color of the line representing the play head - defaults to white
- fill (boolean): notes are filled with color (otherwise only the label is displayed) - 0 by default
- fillActive (boolean): active notes are filled with color - 0 by default
- stroke (boolean): notes are shown with colored borders - 0 by default
- strokeActive (boolean): active notes are shown with colored borders - 0 by default
- hideInactive (boolean): only active notes are shown - 0 by default
- colorizeInactive (boolean): use note color for inactive notes - 1 by default
- fontFamily (string): define the font used by notes labels - defaults to 'monospace'
- minMidi (integer): minimum note value to display on the value axis - defaults to 10
- maxMidi (integer): maximum note value to display on the value axis - defaults to 90
- autorange (boolean): automatically calculate the minMidi and maxMidi parameters - 0 by default

```
note("c2 a2 eb2")
.euclid(5,8)
.s('sawtooth')
.lpenv(4).lpf(300)
.pianoroll({ labels: 1 })
```

## Spiral

Displays a spiral visual.

- options (Object): Object containing all the optional following parameters as key value pairs:
- stretch (number): controls the rotations per cycle ratio, where 1 = 1 cycle / 360 degrees
- size (number): the diameter of the spiral
- thickness (number): line thickness
- cap (string): style of line ends: butt (default), round, square
- inset (string): number of rotations before spiral starts (default 3)
- playheadColor (string): color of playhead, defaults to white
- playheadLength (number): length of playhead in rotations, defaults to 0.02
- playheadThickness (number): thickness of playheadrotations, defaults to thickness
- padding (number): space around spiral
- steady (number): steadyness of spiral vs playhead. 1 = spiral doesn't move, playhead does.
- activeColor (number): color of active segment. defaults to foreground of theme
- inactiveColor (number): color of inactive segments. defaults to gutterForeground of theme
- colorizeInactive (boolean): wether or not to colorize inactive segments, defaults to 0
- fade (boolean): wether or not past and future should fade out. defaults to 1
- logSpiral (boolean): wether or not the spiral should be logarithmic. defaults to 0

```
note("c2 a2 eb2")
.euclid(5,8)
.s('sawtooth')
.lpenv(4).lpf(300)
._spiral({ steady: .96 })
```

## Scope

Synonyms: `tscope`

Renders an oscilloscope for the time domain of the audio signal.

- config (object): optional config with options:
- align (boolean): if 1, the scope will be aligned to the first zero crossing. defaults to 1
- color (string): line color as hex or color name. defaults to white.
- thickness (number): line thickness. defaults to 3
- scale (number): scales the y-axis. Defaults to 0.25
- pos (number): y-position relative to screen height. 0 = top, 1 = bottom of screen
- trigger (number): amplitude value that is used to align the scope. defaults to 0.

```
s("sawtooth")._scope()
```

## Pitchwheel

Renders a pitch circle to visualize frequencies within one octave

- hapcircles (number):
- circle (number):
- edo (number):
- root (string):
- thickness (number):
- hapRadius (number):
- mode (string):
- margin (number):

```
n("0 .. 12").scale("C:chromatic")
.s("sawtooth")
.lpf(500)
._pitchwheel()
```

## Spectrum

Renders a spectrum analyzer for the incoming audio signal.

- config (object): optional config with options:
- thickness (integer): line thickness in px (default 3)
- speed (integer): scroll speed (default 1)
- min (integer): min db (default -80)
- max (integer): max db (default 0)

```
n("<0 4 <2 3> 1>*3")
.off(1/8, add(n(5)))
.off(1/5, add(n(7)))
.scale("d3:minor:pentatonic")
.s('sine')
.dec(.3).room(.5)
._spectrum()
```

## markcss

Overrides the css of highlighted events. Make sure to use single quotes!

```
note("c a f e")
.markcss('text-decoration:underline')
```