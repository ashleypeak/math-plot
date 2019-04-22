# math-plot

A WebComponent canvas for plotting mathematical functions. Spiritual successor of [adm-math](https://github.com/wyattpeak/adm-math).

This component defines the `<math-plot>` element, which will plot a cartesian plane, and related subelements, which allow you to plot curves and otherwise mark up the plane.

## Installation

The component is contained in a single JavaScript file, `math-plot.js`. Simply download it into your project folder.

## Usage

First include the module:

```html
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
| pi-units      | *No value*     | -            | Mark the x axis in multiples of π, e.g. for plotting circular functions. |
| step-x        | Rational*      | *Calculated* | The distance between unit markers on the x axis. |
| step-y        | Rational*      | *Calculated* | The distance between unit markers on the y axis. |
| hide-x-units  | *No value*     | -            | Don't show unit markers on the x axis. |
| hide-y-units  | *No value*     | -            | Don't show unit markers on the y axis. |
| range-x       | Rational pair* | (-10, 10)    | The x values between which the plane will be plotted. |
| range-y       | Rational pair* | (-10, 10)    | The y values between which the plane will be plotted. |
| gutter-left   | Integer        | 20 | The space, in pixels, outside the range on the left which will also be plotted. |
| gutter-right  | Integer        | 20 | The space, in pixels, outside the range on the right which will also be plotted. |
| gutter-top    | Integer        | 20 | The space, in pixels, outside the range on the top which will also be plotted. |
| gutter-bottom | Integer        | 20 | The space, in pixels, outside the range on the bottom which will also be plotted. |

##### Rationals and rational pairs

A **Rational** is an internal class, representing a rational number, optionally multiplied by π, e.g. "pi/2".

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

##### Gutters:

The purpose of the gutters is to allow you to, for example, plot a `sin` curve with `range-x="(0, 2pi)"` without having the graph end abruptly beyond that range.

#### Plotting curves: `<math-plot-function>`

Should be included as a direct child of `<math-plot>`. The `<math-plot-function>` element will accept an argument `rule`, a description of a function in [content MathML](https://www.w3.org/TR/MathML3/chapter4.html), and plot that function.

| Attribute | Value    | Default    | Description                 |
| --------- | -------- | ---------- | --------------------------- |
| rule      | *MathML* | *Required* | The function to be plotted. |

The following MathML elements are accepted:

| Element | Notes |
| ------- | ----- |
| `<cn>` | Only accepts numbers parseable by `parseFloat()`. |
| `<ci>` | Only accepts the value 'x'. |
| `<degree>` | |
| `<apply>` | *See below* |

The following `<apply>` functions are implemented:

| Function | Notes |
| -------- | ----- |
| `<plus>` | |
| `<minus>` | |
| `<times>` | |
| `<divide>` | |
| `<power>` | |
| `<root>` | `<apply>` element is required. |
| `<sin>` | |
| `<cos>` | |
| `<tan>` | |
