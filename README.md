Stable Fluid implementation on JavaScript.

Several ways to run this:

1. Open this repository's [Github pages](https://sowd.github.io/StableFluidsJS/).
2. Open index.html by your favorite browser. Same result as 1.
3. Run python web server and opens the default browser by executing ./run. The result is the same as 1. This way may be suitable for communication with python library, though not tried.
4. Using node.js **node main.js** to simulate without GUI and outputs a sequence of volume data in [Mitsuba Renderer](https://www.mitsuba-renderer.org/releases/current/documentation.pdf)'s gridvolume format under data/ (endian maybe wrong..mine uses big endian.) The rendered file can be loaded by web gui with parameter ?file=[filename] (files are loaded from ./data/, while the [filename] does not contain the prefix./data/.)

URL args:
file=*.vol / loads one volume data (should be regular cubic volume)
type=simulate|noise|data  / simulate:Stable fluid(default), noise:Perlin noise, data:Presimulated volumes under data/*.vol
