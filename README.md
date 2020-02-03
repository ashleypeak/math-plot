# math-plot

A WebComponent canvas for plotting mathematical functions. Spiritual successor of [adm-math](https://github.com/wyattpeak/adm-math).

This component defines the `<math-plot>` element, which will plot a cartesian plane, and related subelements, which allow you to plot curves and otherwise mark up the plane.

## Installation

The component is contained in three JavaScript files, `math-plot.js`, `mathml.js` and `rational.js`. Simply download them into your project folder, ensuring that they are all in the same directory.

## Development

Before doing any development work, NPM dependencies need to be installed. Run:

```bash
$ npm install
```

### Setting up NodeJS dependencies

The math-plot library uses the polylabel library to sensibly position some labels on its plots. As this is a NodeJS, not a frontend, library, it needs to be compiled using browserify. This step isn't needed for end-users, but will be needed if any changes need to be made to the NodeJS dependencies.

Any changes to node dependencies should be made in `node-main.js`. Once the changes are made, run the command:

```bash
$ browserify node-main.js -o dependencies.js
```

The file `dependencies.js` is automatically imported by `math-plot.js`, so nothing more need be done.

**Do not edit `dependencies.js`, make changes in `node-main.js`.**

### Testing

Testing is handled by Jest testing framework. To execute the tests, run `npm run test`.

## Usage

First, install the NPM dependencies (the only dependency is a polyfill to allow WebComponent support in old browsers and Edge). In the project directory, run:

```bash
$ npm install --production
```

In the HTML file, include the polyfill and the module:

```html
<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>

<script type="module" src="math-plot.js"></script>
```

Then place the element as you would any other:

```html
<math-plot></math-plot>
```

That will work, but doesn't give you much context. Here's a more realistic example: a `sin` graph, plotted as you might in an actual application:

```html
<math-plot range-x="(-2pi, 2pi)" range-y="(-1, 1)" pi-units>
    <math-plot-function rule="<apply><sin/><ci>x</ci></apply>"></math-plot-function>
</math-plot>
```

Refer to `examples/basic.html` to see a more examples of graphs.

### Elements and attributes

#### The main element: `<math-plot>`

The `<math-plot>` element will create a canvas, and draw a cartesian plane on it. It implements the following attributes:

| Attribute     | Value          | Default      | Description |
| ------------- | -------------- | ------------ | ----------- |
| width         | Integer        | 300          | The width of the plot element. |
| height        | Integer        | 300          | The height of the plot element. |
| show-grid     | *No value*     | -            | Show dotted lines across the graph at each unit marker. |
| hide-x-axis   | *No value*     | -            | Don't render the x axis. |
| hide-y-axis   | *No value*     | -            | Don't render the y axis. |
| hide-origin   | *No value*     | -            | Don't render the 0 marking the origin. |
| pi-units      | *No value*     | -            | Mark the x axis in multiples of π, e.g. for plotting circular functions. |
| step-x        | Rational* or MathML* | *Calculated* | The distance between unit markers on the x axis. |
| step-y        | Rational* or MathML* | *Calculated* | The distance between unit markers on the y axis. |
| hide-x-units  | *No value*     | -            | Don't show unit markers on the x axis. |
| hide-y-units  | *No value*     | -            | Don't show unit markers on the y axis. |
| range-x       | Rational pair* or MathML `<list>`* | (-10, 10)    | The x values between which the plane will be plotted. |
| range-y       | Rational pair* or MathML `<list>`* | (-10, 10)    | The y values between which the plane will be plotted. |
| gutter-left   | Integer        | 20 | The space, in pixels, outside the range on the left which will also be plotted. |
| gutter-right  | Integer        | 20 | The space, in pixels, outside the range on the right which will also be plotted. |
| gutter-top    | Integer        | 20 | The space, in pixels, outside the range on the top which will also be plotted. |
| gutter-bottom | Integer        | 20 | The space, in pixels, outside the range on the bottom which will also be plotted. |

##### Rationals and rational pairs

A **Rational** is an internal class, representing a rational number, optionally multiplied by π or e, e.g. "pi/2", "2e".

A **Rational pair** is a comma-separated pair of numbers, surrounded by brackets, e.g. "(-2pi, 2pi)".

Ideally, it should allow you to intuitively type a number, but here are some examples of acceptable Rationals:

| Input  | Number |
| ------ | ------ |
| "1"    | 1      |
| "pi"   | π      |
| "-2pi" | -2π    |
| "1/2"  | 0.5    |
| "pi/2" | 0.5*pi |

**Note:** The main limitation is that floats are **not** accepted. You must input a fraction instead.

##### MathML and MathML `<list>`

Many numbers in `math-plot` can be provided using MathML. Although support for elements is not vast, it should include most commonly-used elements.

In particular, the range attributes can be provided as a MathML `<list>` element. The notation for `(0, 2pi)`, for instance, would be:

```xml
<list>
    <cn>0</cn>
    <apply><times/><cn>2</cn><pi/></apply>
</list>
```

##### Gutters:

The purpose of the gutters is to allow you to, for example, plot a `sin` curve with `range-x="(0, 2pi)"` without having the graph end abruptly beyond that range.

#### Plotting curves: `<math-plot-function>`

Should be included as a direct child of `<math-plot>`. The `<math-plot-function>` element will accept an argument `rule`, a description of a function in [content MathML](https://www.w3.org/TR/MathML3/chapter4.html), and plot that function.

| Attribute | Value                | Default    | Description                 |
| --------- | -------------------- | ---------- | --------------------------- |
| rule      | MathML*              | *Required* | The function to be plotted. |
| domain    | Rational pair* or MathML `<list>`* | *None* | The domain in which the function will be plotted. If undefined, the function will be plotted over its natural domain. |
| color     | CSS color descriptor | #000000    | The color of the plotted function. |
| dashed    | *No value*           | -          | If included, the curve will be dashed rather than solid. |

The following MathML elements are accepted:

| Element | Notes |
| ------- | ----- |
| `<cn>` | Only accepts numbers parseable by `parseFloat()`. |
| `<ci>` | Only accepts the value 'x'. |
| `<pi>` | The constant π |
| `<exponentiale>` | The constant e |
| `<degree>` | |
| `<logbase>` | |
| `<apply>` | *See below* |

The following `<apply>` functions are implemented:

| Function | Notes |
| -------- | ----- |
| `<plus>` | |
| `<minus>` | |
| `<times>` | |
| `<divide>` | |
| `<power>` | |
| `<root>` | `<degree>` element is required, must be first argument. |
| `<sin>` | |
| `<cos>` | |
| `<tan>` | |
| `<abs>` | |
| `<log>` | `<logbase>` element is optional, but if included must be first argument. If not included, defaults to 10. |
| `<ln>` | |

#### Plotting lines: `<math-plot-line>`

Should be included as a direct child of `<math-plot>`. The `<math-plot-line>` element will accept two arguments `point-a` and `point-b`, and will plot the line running through both.

| Attribute | Value                | Default    | Description                             |
| --------- | -------------------- | ---------- | --------------------------------------- |
| point-a   | Rational pair* or MathML `<list>`* | *Required* | A point that the line will run through. |
| point-b   | Rational pair* or MathML `<list>`* | *Required* | A point that the line will run through. |
| color     | CSS color descriptor | #000000    | The color of the line. |
| dashed    | *No value*           | -          | If included, the curve will be dashed rather than solid. |

#### Plotting line segments: `<math-plot-line-segment>`

Should be included as a direct child of `<math-plot>`. The `<math-plot-line-sgment>` element will accept two arguments `point-a` and `point-b`, and will plot a line segment between the two.

| Attribute | Value                | Default    | Description                  |
| --------- | -------------------- | ---------- | ---------------------------- |
| point-a   | Rational pair* or MathML `<list>`* | *Required* | One end of the line segment. |
| point-b   | Rational pair* or MathML `<list>`* | *Required* | One end of the line segment. |
| label     | String               | *None*     | A text label for the line segment. Will be written beside or above the line segment. |
| color     | CSS color descriptor | #000000    | The color of the line segment. |
| dashed    | *No value*           | -          | If included, the curve will be dashed rather than solid. |

**Note:** The logic for positioning the label is not sophisticated. If unsatisfactory, use the `<math-plot-text>` element instead.

#### Plotting asymptotes: `<math-plot-asymptote>`

Should be included as a direct child of `<math-plot>`. The `<math-plot-asymtote>` element will one or both arguments `x-intercept` or `y-intercept`. With one, it will plot a vertical or horizontal asymptote running through that intercept. With both, it will plot a slanted asymptote running through both.

A `<math-plot-asymptote>` element cannot take the `dashed` attribute as an asymptote is by default dashed.

| Attribute | Value                | Default    | Description                  |
| --------- | -------------------- | ---------- | ---------------------------- |
| x-intercept | Rational* or MathML* | *None*     | The x intercept of the asymptote. |
| y-intercept | Rational* or MathML* | *None*     | The y intercept of the asymptote. |
| color     | CSS color descriptor | #000000    | The color of the asymptote. |

#### Plotting points: `<math-plot-point>`

Should be included as a direct child of `<math-plot>`. The `<math-plot-point>` element will mark a point at the position `position`, optionally labelled with `label`.

| Attribute | Value                | Default    | Description                  |
| --------- | -------------------- | ---------- | ---------------------------- |
| position  | Rational pair* or MathML `<list>`* | *Required* | The position of the point to be marked. |
| label     | String               | *None*     | A text label for the point. |
| label-coordinates | *No value*   | -          | Label the point with the coordinates of the point in the form `(a, b)`. |
| color     | CSS color descriptor | #000000    | The color of the point. |

##### Position

The logic for positioning the label is not sophisticated. In fact, it's just placed below and to the right of the point, with no consideration for collision. If unsatisfactory, use the `<math-plot-text>` element instead.

##### Labels

Only one of `label` and `label-coordinates` may be used on a single point. If both are present, `label` will be shown.

#### Plotting text: `<math-plot-text>`

Should be included as a direct child of `<math-plot>`. The `<math-plot-text>` element will render the text in the attribute `text` on the plot.

| Attribute | Value                | Default    | Description                  |
| --------- | -------------------- | ---------- | ---------------------------- |
| text      | String               | *Required* | The string or character to be rendered. |
| top*      | Rational* or MathML* | *None*     | The vertical position of the text, in coordinate units. |
| bottom*   | Rational* or MathML* | *None*     | The vertical position of the text, in coordinate units. |
| left*     | Rational* or MathML* | *None*     | The horizontal position of the text, in coordinate units. |
| right*    | Rational* or MathML* | *None*     | The horizontal position of the text, in coordinate units. |
| color     | CSS color descriptor | #000000    | The color of the text. |

##### Text position

Only one of `top` and `bottom` will be used. If both are present, `top` will be used. Similarly, for `left` and `right`, `left` will be preferenced.

The position attributes should be given in terms of coordinates on the graph. A text element at `top="1" left="1"` will be rendered with its top-left corner at the point `(1, 1)` on the graph.

#### Plotting filled regions: `<math-plot-floodfill>`

Should be included as a direct child of `<math-plot>`. The `<math-plot-floodfill>` element will floodfill a region described below.

| Attribute   | Value                | Default    | Description                  |
| ----------- | -------------------- | ---------- | ---------------------------- |
| rule-top    | MathML*              | *None*     | The top of the region to be filled.    |
| rule-bottom | MathML*              | *None*     | The bottom of the region to be filled. |
| domain      | Rational pair* or MathML `<list>`* | *None* | The domain in which the region will be filled. |
| label       | String               | *None*     | The text with which to label the the filled region. |
| fill-color  | CSS color descriptor | #d4d4d4    | The color of the filled region. |
| color       | CSS color descriptor | #000000    | The color of the label text. |

##### The filled region
If both the `rule-top` and `rule-bottom` attributes are defined, the space between them will be filled regardless of which is on top across the entire `domain`, even if they cross within the domain. You could, for example, plot the space between `sin(x)` and the `x` axis using:

```html
<math-plot-floodfill
    rule-top="<apply><sin/><ci>x</ci></apply>"
    rule-bottom="<cn>0</cn>">
</math-plot-floodfill>
```

If only `rule-top` is defined, the space between it and the bottom of the plot will be filled. If only `rule-bottom` is defined, the space between it and the top of the plot will be filled.

If `domain` is undefined, the region will be filled over the domain of the plot. This may result in unexpected behaviour if either `rule-top` or `rule-bottom` is not defined over the entire plot.
