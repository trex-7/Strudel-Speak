# CSOUND
Source: https://strudel.cc/learn/csound/
Category: guides

# Using CSound with Strudel

🧪 Strudel has experimental support for csound, using [@csound/browser](https://www.npmjs.com/package/@csound/browser).

## Importing .orc files

To use existing csound instruments, you can load and use an orc file from an URL like this:

Note that the above url uses the `github:` shortcut, which resolves to the raw file on github, but you can use any URL you like.

The awesome [`livecode.orc by Steven Yi`](https://github.com/kunstmusik/csound-live-code) comes packed with many sounds ready for use:

## Writing your own instruments

You can define your own instrument(s) with `loadCsound` like this:

## Parameters

The `.csound` function sends the following p values:

|  |  |
| --- | --- |
| p1 | instrument name e.g. `CoolSynth` |
| p2 | time offset, when it should play |
| p3 | the duration of the event / hap |
| p4 | frequency in Hertz |
| p5 | normalized `gain`, 0-1 |

There is an alternative `.csoundm` function with a different flavor:

|  |  |
| --- | --- |
| p4 | midi key number, unrounded, 0-127 |
| p5 | midi velocity, 0-127 |

In both cases, p4 is derived from the value of `freq` or `note`.

## Limitations / Future Plans

Apart from the above listed p values, no other parameter can be patterned so far.
This also means that [audio effects](https://strudel.cc/learn/effects/) will not work.
In the future, the integration could be improved by passing all patterned control parameters to the csound instrument.
This could work by a unique [channel](https://kunstmusik.github.io/icsc2022-csound-web/tutorial2-interacting-with-csound/#step-4---writing-continuous-data-channels)
for each value. Channels could be read [like this](https://github.com/csound/csound/blob/master/Android/CsoundForAndroid/CsoundAndroidExamples/src/main/res/raw/multitouch_xy.csd).
Also, it might make sense to have a standard library of csound instruments for strudel’s effects.