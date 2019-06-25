import Rational from './rational.js';
import MathML from './mathml.js';

// The name of the WebComponent element tag (and the prefix to the subelement
// tag names)
const TAGNAME = 'math-plot';

// The default size, in pixels, of the gutters (the part of the graph which is
// plotted despite being outside the stated range, so the graph doesn't stop
// abruptly)
const GUTTER_LEFT = 30;
const GUTTER_RIGHT = 30;
const GUTTER_TOP = 20;
const GUTTER_BOTTOM = 20;

// The radius, in pixels, of a <math-plot-point>
const POINTRADIUS = 3;

// The space reserved, in pixels, for the axis labels (the 'x' and 'y' text)
const LABELWIDTH = 15;
const LABELHEIGHT = 21;

// The size, in pixels, of the arrows at the top/right of the axes
const AXIS_ARROW_LENGTH = 10;

const FONTSIZE = 17;

// The (default) minimum space, in pixels, between two axis markers
const MINSTEPSIZE = 40;

// The default properties of all canvas lines (used for functions, asymptotes,
// etc.)
const DEFAULT_PLOT_PARAMETERS = {
    lineWidth: 2,
    color: '#000000',
    lineDash: []
};

// The template used to build the <math-plot> WebComponent's ShadowRoot
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
    <canvas id='canvas' class='canvas'></canvas>
`;

/**
 * Assert that `condition` is true. If it is not, raise an error with
 * message `message`.
 * 
 * @param  {Boolean} condition The condition being asserted
 * @param  {String} message    The error string to be raised if condition
 *                             is false
 */
function assert(condition, message) {
    if(!condition) {
        throw new Error(message);
    }
}


/**
 * The MathPlot is a canvas element which plots graphs of mathematical
 * functions
 */
class MathPlot extends HTMLElement {
    /**
     * Initialises all canvas properties, but doesn't draw anything until
     * connectedCallback()
     * 
     * @constructs
     */
    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
        this.canvas = this.shadowRoot.getElementById('canvas');
        this.context = this.canvas.getContext('2d');

        //define canvas properties
        this._initDefinedProperties();
        this._initDerivedProperties();

        //intialise canvas
        this.canvas.setAttribute('width', this.width);
        this.canvas.setAttribute('height', this.height);

        //initialise context
        this.context.font = FONTSIZE + 'px serif';
    }

    /**
     * Collect all properties defined by attributes, or else set them to
     * default values.
     */
    _initDefinedProperties() {
        //initialise graph parameters
        this.width = this.getAttribute('width') || 300;
        this.height = this.getAttribute('height') || 300;
        this.drawXAxis = this.getAttribute('hide-x-axis') !== null ? false : true;
        this.drawYAxis = this.getAttribute('hide-y-axis') !== null ? false : true;
        this.drawGrid = this.getAttribute('show-grid') !== null ? true : false;
        //indicates that the x axis only should be measured in multiples of pi
        this.piUnits = this.getAttribute('pi-units') !== null ? true : false;
        //overrides the default unit-marking step sizes
        //if not set, will be defined after unitSize in _initDerivedProperties()
        this.stepX = this.getAttribute('step-x') ?
            this._parseNumberToRational(this.getAttribute('step-x')) : null;
        this.stepY = this.getAttribute('step-y') ?
            this._parseNumberToRational(this.getAttribute('step-y')) : null;
        this.drawXUnits = this.getAttribute('hide-x-units') !== null ? false : true;
        this.drawYUnits = this.getAttribute('hide-y-units') !== null ? false : true;

        this.range = {
            x: this._parseRange(this.getAttribute('range-x') || '(-10, 10)'),
            y: this._parseRange(this.getAttribute('range-y') || '(-10, 10)')
        }

        this.gutter = {
            left: parseInt(this.getAttribute('gutter-left')) || GUTTER_LEFT,
            right: parseInt(this.getAttribute('gutter-right')) || GUTTER_RIGHT,
            top: parseInt(this.getAttribute('gutter-top')) || GUTTER_TOP,
            bottom: parseInt(this.getAttribute('gutter-bottom')) || GUTTER_BOTTOM
        }
    }

    /**
     * Given the value of a `range` attribute of <math-plot>, return the parsed
     * range.
     *
     * The range can either be a given as a tuple of Rationals:
     *     "(0, 2pi)"
     * or as a MathML <list>:
     *     "<list><cn>0</cn><apply><times/><cn>2</cn><pi/></apply></list>"
     *
     * The range is returned as an object:
     *     {min:_, max:_, size:_}
     * 
     * @param  {String} rangeStr The string representation of the range
     * @return {Object}          The calculated range, in ints/floats
     */
    _parseRange(rangeStr) {
        let rangeList = this._parseList(rangeStr)

        assert(
            rangeList.length == 2 &&
            rangeList[0] < rangeList[1],
            "Invalid range provided.");

        let range = {
            min: rangeList[0],
            max: rangeList[1],
            size: rangeList[1] - rangeList[0]
        };

        return range;
    }

    /**
     * Given a string describing a list, either as a tuple of Rationals or a
     * MathML <list>, return an equivalent array of ints/floats.
     *
     * The list can, as described, either be a given as a tuple of Rationals:
     *     "(0, 1, 2pi)"
     * or as a MathML <list>:
     *     "<list>
     *         <cn>0</cn>
     *         <cn>1</cn>
     *         <apply><times/><cn>2</cn><pi/></apply>
     *      </list>"
     *
     * The return will be an array of ints/floats:
     *     [0, 1, 6.283...]
     * 
     * @param  {String} listStr The string representation of the list
     * @return {Array}          An equivalent array of ints/floats
     */
    _parseList(listStr) {
        listStr = listStr.trim();
        if(listStr.length >= 6 && listStr.slice(0, 6) == '<list>') {
            let listMathML = new MathML(listStr);

            //since a range shouldn't have any unknowns in it, it shouldn't
            //matter what argument you pass exec(). Just pass something because
            //all MathML functions are built to expect an x value
            var list = listMathML.exec(0);
        } else {
            var list =
                Rational.parseTuple(listStr).map(el => el.approx);
        }

        return list;
    }

    /**
     * Given a string describing a number, either as a Rational or a MathML
     * term, return the equivalent Rational
     *
     * The term can, as described, either be a given as a Rational:
     *     "2pi"
     * or as MathML:
     *     "<apply><times/><cn>2</cn><pi/></apply>"
     *
     * The return will be a Rational:
     *     Rational("2pi")
     *
     * @param  {String}    numStr  The string representation of the number
     * @return {Rational}          An equivalent Rational
     */
    _parseNumberToRational(numStr) {
        numStr = numStr.trim();
        if(numStr[0] == '<') {
            let numMathML = new MathML(numStr);

            return numMathML.rational;
        } else {
            return new Rational(numStr);
        }
    }

    /**
     * Given a string describing a number, either as a Rational or a MathML
     * term, return an equivalent int/float.
     *
     * The term can, as described, either be a given as a Rational:
     *     "2pi"
     * or as MathML:
     *     "<apply><times/><cn>2</cn><pi/></apply>"
     *
     * The return will be an int/float:
     *     6.283
     *
     * @param  {String}    numStr  The string representation of the number
     * @return {Int|Float}         An equivalent int/float
     */
    _parseNumberToApprox(numStr) {
        numStr = numStr.trim();
        if(numStr[0] == '<') {
            let numMathML = new MathML(numStr);

            //since a range shouldn't have any unknowns in it, it shouldn't
            //matter what argument you pass exec(). Just pass something because
            //all MathML functions are built to expect an x value
            var num = numMathML.exec(0);
        } else {
            var num = new Rational(numStr);
            num = num.approx;
        }

        return num;
    }

    /**
     * Initialise all object properties which can be derived from provided
     * attributes (or defaults).
     *
     * A note on layout:
     * The canvas in broken up vertically into four sections:
     *  - top label, where the y axis is labelled
     *  - top gutter, which is plotted but outside of rangeY (see below)
     *  - the main range of the graph, defined by rangeY
     *  - bottom gutter, like top
     * The canvas is broken up similarly on the x axis.
     * Gutters and range are controllable via attributes, label is present
     * if the axis is drawn, and size is determined by LABELWIDTH / LABELHEIGHT
     *
     * The purpose behind the gutters is to allow the graph not to end abruptly
     * beyond the area of interest. Suppose you're looking at a sine graph -
     * you might only care about the range [0, 2pi], but plotting precisely
     * that would be disconcerting (0 at the very left pixel of the graph).
     * While plotting, I found I would add a small region to the start and end,
     * but that was time consuming for many graphs. Gutters simplify that.
     * 
     * In general, plot using this.drawRegion rather than this.range. Doing so
     * will draw in the gutters as well, which is after all their point.
     */
    _initDerivedProperties() {
        let drawLabelWidth = (this.drawXAxis ? LABELWIDTH : 0);
        let drawLabelHeight = (this.drawYAxis ? LABELHEIGHT : 0);

        //the area, in canvas coords, of the main region (that is, the area
        //bounded in graph coords by this.range)
        this.main = {
            left: this.gutter.left,
            right: this.width - this.gutter.right - AXIS_ARROW_LENGTH - drawLabelWidth,
            top: this.gutter.top + AXIS_ARROW_LENGTH + drawLabelHeight,
            bottom: this.height - this.gutter.bottom
        }
        this.main.width = this.main.right - this.main.left;
        this.main.height = this.main.bottom - this.main.top;

        //the center positions relative to the graph range
        let relativeCentreX = (0 - this.range.x.min) / this.range.x.size;
        let relativeCentreY = (0 - this.range.y.min) / this.range.y.size;
        //the center of the graph in canvas coords
        this.center = {
            x: this.main.left + relativeCentreX * this.main.width,
            y: this.main.bottom - relativeCentreY * this.main.height
        }

        //the size in pixels of a step of 1 in either axis
        this.unitSize = {
            x: this.main.width / this.range.x.size,
            y: this.main.height / this.range.y.size
        }

        //if steps weren't defined, calculate them now
        this.stepX = this.stepX || this._getStepSize('x');
        this.stepY = this.stepY || this._getStepSize('y');

        //the size of each gutter in graph coords
        let gutterLeft = this.gutter.left / this.unitSize.x;
        let gutterRight = this.gutter.right / this.unitSize.x;
        let gutterTop = this.gutter.top / this.unitSize.y;
        let gutterBottom = this.gutter.bottom / this.unitSize.y;

        let arrowWidth = AXIS_ARROW_LENGTH / this.unitSize.x;
        let arrowHeight = AXIS_ARROW_LENGTH / this.unitSize.y;

        //the area that needs to be plotted (main and gutters) in graph coords
        this.drawRegion = {
            left: this.range.x.min - gutterLeft,
            right: this.range.x.max + gutterRight,
            top: this.range.y.max + gutterTop,
            bottom: this.range.y.min - gutterBottom
        }
        this.drawRegion.width = this.drawRegion.right - this.drawRegion.left;
        this.drawRegion.height = this.drawRegion.top - this.drawRegion.bottom;

        //one unit of graph units, in canvas coords (pixels)
        this.scale = {
            x: (this.width - drawLabelWidth - AXIS_ARROW_LENGTH) / this.drawRegion.width,
            y: -(this.height - drawLabelHeight - AXIS_ARROW_LENGTH) / this.drawRegion.height
        }
    }

    /**
     * Connected to the DOM. Draw the axes, then all of the curves.
     */
    connectedCallback() {
        this.drawAxes();

        for(let child of this.children) {
            let tag = child.tagName.toLowerCase();
            tag = tag.substring(TAGNAME.length + 1); // remove math-plot-

            switch(tag) {
                case 'function':
                    this._plotFunctionElement(child);
                    break;
                case 'line':
                    this._plotLineElement(child);
                    break;
                case 'line-segment':
                    this._plotLineSegmentElement(child);
                    break;
                case 'asymptote':
                    this._plotAsymptoteElement(child);
                    break;
                case 'point':
                    this._plotPointElement(child);
                    break;
                case 'text':
                    this._plotTextElement(child);
                    break;
            }
        }
    }

    /**
     * Given a <math-plot-function> element, plot the function described.
     * 
     * @param  {HTMLElement} el The <math-plot-function> element
     */
    _plotFunctionElement(el) {
        let rule = el.getAttribute('rule');
        let mathml = new MathML(rule);
        let domain = el.getAttribute('domain');
        let params = this._getParams(el);

        if(domain !== null) {
            domain = this._parseList(domain);

            domain[0] = Math.max(domain[0], this.drawRegion.left);
            domain[1] = Math.min(domain[1], this.drawRegion.right);

            assert(domain.length === 2,
                '<math-plot-function> Invalid domain provided.')

            this.plotFunction(params, mathml.exec, domain);
        } else {
            this.plotFunction(params, mathml.exec);
        }
    }

    /**
     * Given a <math-plot-line> element, plot the line described.
     * 
     * @param  {HTMLElement} el The <math-plot-line> element
     */
    _plotLineElement(el) {
        let pointA = this._parseList(el.getAttribute('point-a'));
        let pointB = this._parseList(el.getAttribute('point-b'));
        let params = this._getParams(el);

        assert(pointA.length === 2 && pointB.length === 2,
            '<math-plot-line> Invalid points provided.');

        let rise = pointB[1] - pointA[1];
        let run = pointB[0] - pointA[0];

        if(run === 0) {
            assert(rise !== 0,
                '<math-plot-line> The two points cannot be the same.');
            this.plotVerticalLine(params, pointA[0]);
        } else {
            let m = rise / run;
            let func = (x => m * (x - pointA[0]) + pointA[1]);
            this.plotFunction(params, func);
        }
    }

    /**
     * Given a <math-plot-line-segment> element, plot the line segment
     * described.
     * 
     * @param  {HTMLElement} el The <math-plot-line-segment> element
     */
    _plotLineSegmentElement(el) {
        let pointA = this._parseList(el.getAttribute('point-a'));
        let pointB = this._parseList(el.getAttribute('point-b'));
        let label = el.getAttribute('label');
        let params = this._getParams(el);

        assert(pointA.length === 2 && pointB.length === 2,
            '<math-plot-line-segment> Invalid points provided.');

        assert(pointA[0] !== pointB[0] || pointA[1] !== pointB[1],
            '<math-plot-line-segment> The two points cannot be the same.');

        this.plotLineSegment(params, pointA, pointB, label);
    }

    /**
     * Given a <math-plot-asymptote> element, plot the asymptote described
     * 
     * @param  {HTMLElement} el The <math-plot-asymptote> element
     */
    _plotAsymptoteElement(el) {
        let xIntercept = el.getAttribute('x-intercept');
        let yIntercept = el.getAttribute('y-intercept');
        let params = this._getParams(el);

        // asymptotes are automatically dashed
        params.lineDash = [10, 5];

        if(xIntercept !== null && yIntercept !== null) {
            let xInt = this._parseNumberToApprox(xIntercept);
            let yInt = this._parseNumberToApprox(yIntercept);

            let rise = -yInt;
            let run = xInt;
            let m = rise / run;

            let func = (x => m * x + yInt);
            this.plotFunction(params, func);
        } else if(xIntercept !== null) {
            let int = this._parseNumberToApprox(xIntercept);

            this.plotVerticalLine(params, int);
        } else if(yIntercept !== null) {
            let int = this._parseNumberToApprox(yIntercept);

            this.plotHorizontalLine(params, int);
        }
    }

    /**
     * Given a <math-plot-point> element, plot the point.
     * 
     * @param  {HTMLElement} el The <math-plot-point> element
     */
    _plotPointElement(el) {
        let pos = this._parseList(el.getAttribute('position'));
        let label = el.getAttribute('label');
        let params = this._getParams(el);

        assert(pos.length === 2,
            '<math-plot-point> Invalid position provided.');

        this.plotPoint(params, pos, label);
    }

    /**
     * Given a <math-plot-text> element, render the text described.
     * 
     * @param  {HTMLElement} el The <math-plot-text> element
     */
    _plotTextElement(el) {
        let top = el.getAttribute('top');
        let bottom = el.getAttribute('bottom');
        let left = el.getAttribute('left');
        let right = el.getAttribute('right');
        let text = el.getAttribute('text');
        let params = this._getParams(el);

        assert(typeof text === "string" && text.length > 0,
            '<math-plot-text> No text given.');

        let pos = {}

        if(top !== null) {
            pos.top = this._parseNumberToApprox(top);
        } else if(bottom !== null) {
            pos.bottom = this._parseNumberToApprox(bottom);
        }

        if(left !== null) {
            pos.left = this._parseNumberToApprox(left);
        } else if(right !== null) {
            pos.right = this._parseNumberToApprox(right);
        }

        this.plotText(params, text, pos);
    }

    /**
     * Given a <math-plot-?> subelement, collect its generic properties, like
     * color and whether or not it's dashed, and return them as an object to
     * be used in _plotRender().
     *
     * @see  _plotRender()
     * @param  {HTMLElement} el The element whose properties are being collected
     * @return {Object}         The collected properties
     */
    _getParams(el) {
        let params = new Object();

        let color = el.getAttribute('color');
        if(color !== null) {
            params.color = color;
        }

        let dashed = el.getAttribute('dashed');
        if(dashed !== null) {
            params.lineDash = [10, 5];
        }

        return params;
    }

    /**
     * Draw the axes of the graph, as well as the unit markers and grid lines.
     * Finally, label all of the unit markers.
     */
    drawAxes() {
        if(this.drawYAxis) {
            assert(this.range.x.min <= 0 && this.range.y.max >= 0,
                'Cannot draw the y axis as it is out of range.')

            let labelWidth = this.context.measureText('y').width;

            //has to be fudged to look right
            let labelPosY = FONTSIZE * 4/5;
            let labelPosX = this.center.x - (labelWidth / 2);
            this.context.fillText('y', labelPosX, labelPosY);

            this._drawLine(this.center.x, LABELHEIGHT + AXIS_ARROW_LENGTH, this.center.x,
                this.height, 2);

            this.context.beginPath();
            this.context.lineWidth = 1;
            this.context.moveTo(this.center.x, LABELHEIGHT);
            this.context.lineTo(this.center.x + 5, LABELHEIGHT + AXIS_ARROW_LENGTH);
            this.context.lineTo(this.center.x - 5, LABELHEIGHT + AXIS_ARROW_LENGTH);
            this.context.fill();

            if(this.drawYUnits) {
                let stepSize = this.stepY;
                let i = stepSize.times(Math.ceil(this.drawRegion.bottom / stepSize.approx));
                for(; i.lessThan(this.drawRegion.top); i = i.plus(stepSize)) {
                    if(!(i.equal(0))) {
                        let yPos = this.center.y - i.approx * this.unitSize.y;

                        this._drawLine(this.center.x, yPos, this.center.x + 6, yPos, 2);
                        i.draw(this.context, {top: yPos, right: this.center.x});

                        if(this.drawGrid) {
                            this._drawLine(0, yPos, this.width - LABELWIDTH, yPos, 1,
                                [5, 5]);
                        }
                    }
                }
            }
        }

        if(this.drawXAxis) {
            assert(this.range.y.min <= 0 && this.range.y.max >= 0,
                'Cannot draw the x axis as it is out of range.')

            let labelWidth = this.context.measureText('x').width;

            //has to be fudged to look right
            let labelPosY = this.center.y + FONTSIZE / 3;
            let labelPosX = this.width - (LABELWIDTH / 2) - (labelWidth / 2);
            this.context.fillText('x', labelPosX, labelPosY);

            this._drawLine(0, this.center.y, this.width - LABELWIDTH - AXIS_ARROW_LENGTH, this.center.y, 2);

            this.context.beginPath();
            this.context.lineWidth = 1;
            this.context.moveTo(this.width - LABELWIDTH, this.center.y);
            this.context.lineTo(this.width - LABELWIDTH - AXIS_ARROW_LENGTH, this.center.y + 5);
            this.context.lineTo(this.width - LABELWIDTH - AXIS_ARROW_LENGTH, this.center.y - 5);
            this.context.fill();

            if(this.drawXUnits) {
                let stepSize = this.stepX;
                let xMin = this.range.x.min
                let i = stepSize.times(Math.ceil(this.drawRegion.left / stepSize.approx));
                for(; i.lessThan(this.drawRegion.right); i = i.plus(stepSize)) {
                    if(!(i.equal(0))) {
                        let xPos = this.center.x + i.approx * this.unitSize.x;

                        //are any of the labels fractions? if step is an integer,
                        //or an integral multiple of pi, then no.
                        if(stepSize.approx === parseInt(stepSize.approx)) {
                            var areFractions = false;
                        } else {
                            let stepSizeDivPi = stepSize.divide(new Rational("pi"));

                            if(stepSizeDivPi.approx === parseInt(stepSizeDivPi.approx)) {
                                var areFractions = false;
                            } else {
                                var areFractions = true;
                            }
                        }

                        this._drawLine(xPos, this.center.y, xPos, this.center.y - 6, 2);
                        if(i.greaterThan(0)) {
                            i.draw(this.context, {top: this.center.y, left: xPos}, areFractions);
                        } else if(i.lessThan(0)) {
                            i.draw(this.context, {top: this.center.y, right: xPos}, areFractions);
                        }

                        if(this.drawGrid) {
                            this._drawLine(xPos, LABELHEIGHT, xPos, this.height, 1,
                                [5, 5]);
                        }
                    }
                }
            }
        }

        //draw origin
        let origin = new Rational(0);
        origin.draw(this.context, {top: this.center.y, right: this.center.x});
    }

    /**
     * Utility function to draw a line.
     * 
     * @param  {Number} startX    Starting x position
     * @param  {Number} startY    Starting y position
     * @param  {Number} endX      Ending x position
     * @param  {Number} endY      Ending y position
     * @param  {Number} lineWidth The width of the drawn line
     * @param  {Array}  lineDash  @see canvas function setLineDash()
     */
    _drawLine(startX, startY, endX, endY, lineWidth=1, lineDash=[]) {
        this.context.beginPath();
        this.context.setLineDash(lineDash);
        this.context.lineWidth = lineWidth;
        this.context.moveTo(startX, startY);
        this.context.lineTo(endX, endY);
        this.context.stroke();
        this.context.setLineDash([]);
    }

    /**
     * Calculate the smallest step size (of the form n units or 1/n units)
     * larger than MINSTEPSIZE.
     *
     * A step is the distance between two unit markers on an axis. MINSTEPSIZE
     * is the minimum distance, in pixels, between two markers. This function
     * will calculate the best step size in graph units, best being the
     * smallest size greater than MINSTEPSIZE which is either an integer or the
     * reciprocal of an integer.
     * 
     * @param  {String} axis The axis whose step size to calculate. 'x' or 'y'
     * @return {Rational}    The calculated step size
     */
    _getStepSize(axis) {
        if(axis === 'x') {
            var unitSize = this.unitSize.x;
        } else if(axis == 'y') {
            var unitSize = this.unitSize.y;
        } else {
            throw new Error('axis paramter must be x or y');
        }

        let baseStepSize =
            axis === 'x' && this.piUnits ? new Rational("pi") : new Rational(1);
        let stepSizePixels = unitSize * baseStepSize.approx;

        if(stepSizePixels === MINSTEPSIZE) {
            return baseStepSize;
        } else if(stepSizePixels < MINSTEPSIZE) {
            for(var i = 2; stepSizePixels < MINSTEPSIZE; i++) {
                let stepSize = baseStepSize.times(i);
                stepSizePixels = unitSize * stepSize.approx;
            }

            return baseStepSize.times(i - 1);
        } else {
            for(var i = 2; stepSizePixels > MINSTEPSIZE; i++) {
                let stepSize = baseStepSize.divide(i);
                stepSizePixels = unitSize * stepSize.approx;
            }

            //can't be zero because i will always be incremented at least once
            return baseStepSize.divide(i - 2);
        }
    }

    /**
     * Given a (JavaScript) function `func`, which will convert an x coordinate
     * into the appropriate y coordinate for a (mathematical) function, plot
     * the curve of said mathematical function.
     * 
     * @param  {Object}   params  Line parameters, @see _renderLine
     * @param  {Function} func    A JS function describing the curve to be
     *                            plotted
     * @param  {Array}    domain  (Optional) The domain in which to draw the
     *                            function
     */
    plotFunction(params, func, domain) {
        //the distance in graph coords equal to a pixel, inverse of scale.x
        let drawStep = 1 / this.scale.x;

        if(typeof domain == "undefined") {
            domain = [this.drawRegion.left, this.drawRegion.right];
        }

        this.context.save();
            //move (0,0) to graph centre;
            this.context.translate(this.center.x, this.center.y)
            //change scale from pixels to graph units, and invert y axis
            this.context.scale(this.scale.x, this.scale.y);
            
            this.context.beginPath();
            this.context.moveTo(domain[0], func(domain[0]));
            
            let prevY = func(domain[0]);
            for(var x = domain[0]; x <= domain[1]; x += drawStep) {
                let curY = func(x);

                if(Math.abs(curY-prevY) > this.drawRegion.height) {
                    //if the difference between the y values of two points is
                    //greater than the entire draw region, assume it's a
                    //discontinuity and move to, rather than draw a line to,
                    //the next point.
                    this.context.moveTo(x, curY);
                } else if(curY >= this.drawRegion.top) {
                    //if the line is going to be drawn past drawRegion.top,
                    //clip it
                    //if the previous one was also past the top, skip entirely
                    //so you don't get a horizontal line at drawRegion.top
                    if(prevY < this.drawRegion.top) {
                        this.context.lineTo(x, this.drawRegion.top);
                    } else {
                        this.context.moveTo(x, curY);
                    }
                } else {
                    this.context.lineTo(x, curY);
                }

                prevY = curY;
            }

            // Draw a line to the right end of the domain. If the gradient of
            // a function near the right end of the domain is very large, even
            // one drawStep's distance can leave a visible gap. This resolves
            // it.
            // The logic here is the same as above, rewritten to skip the bits
            // which aren't relevant to the final point in the domain.
            let curY = func(domain[1]);
            if(Math.abs(curY-prevY) <= this.drawRegion.height) {
                if(curY < this.drawRegion.top) {
                    this.context.lineTo(domain[1], curY);
                } else if(prevY < this.drawRegion.top) {
                    this.context.lineTo(domain[1], this.drawRegion.top);
                }
            }

        this.context.restore();

        this._renderLine(params);
    }

    /**
     * Given an x intercept `x`, plot a vertical line running from top to
     * bottom of the graph.
     * 
     * @param  {Object} params Line parameters, @see _renderLine
     * @param  {Number} x      The x intercept of the line
     */
    plotVerticalLine(params, x) {
        this.context.save();
            this.context.translate(this.center.x, this.center.y);
            this.context.scale(this.scale.x, this.scale.y);
            
            this.context.beginPath();
            this.context.moveTo(x, this.drawRegion.bottom);
            this.context.lineTo(x, this.drawRegion.top);
        this.context.restore();
        
        this._renderLine(params);
    }

    /**
     * Given a y intercept `y`, plot a horizontal line running from left to
     * right of the graph.
     * 
     * @param  {Object} params Line parameters, @see _renderLine
     * @param  {Number} y      The y intercept of the line
     */
    plotHorizontalLine(params, y) {
        this.context.save();
            this.context.translate(this.center.x, this.center.y);
            this.context.scale(this.scale.x, this.scale.y);
            
            this.context.beginPath();
            this.context.moveTo(this.drawRegion.left, y);
            this.context.lineTo(this.drawRegion.right, y);
        this.context.restore();
        
        this._renderLine(params);
    }

    /**
     * Given two points (each an array of two numbers [x, y]) plot a line
     * segment between them.
     * If `label` !== null, write the label as well. Note that the logic
     * for label positioning isn't sophisticated, <math-plot-text> is a better
     * option for more control.
     * 
     * @param  {Object} params Line parameters, @see _renderLine
     * @param  {Array}  pointA One end of the line segment
     * @param  {Array}  pointB The other end of the line segment
     * @param  {String} label  (Optional) A text label for the line segment
     */
    plotLineSegment(params, pointA, pointB, label) {
        this.context.save();
            this.context.translate(this.center.x, this.center.y);
            this.context.scale(this.scale.x, this.scale.y);
            
            this.context.beginPath();
            this.context.moveTo(pointA[0], pointA[1]);
            this.context.lineTo(pointB[0], pointB[1]);
        this.context.restore();
        
        this._renderLine(params);

        if(label !== null) {
            let midPoint = [
                (pointA[0] + pointB[0]) / 2,
                (pointA[1] + pointB[1]) / 2
            ];

            let rise = pointB[1] - pointA[1];
            let run = pointB[0] - pointA[0];

            //make a best guess for where the label should go based on the
            //slope of the line segment
            let pos = null;
            if(run === 0 || (rise / run) > 10) {
                pos = {left: midPoint[0], centerY: midPoint[1]};
            } else if(rise / run > 1) {
                pos = {left: midPoint[0], top: midPoint[1]};
            } else if(rise / run > 0.1) {
                pos = {right: midPoint[0], bottom: midPoint[1]};
            } else if(rise / run > -0.1) {
                pos = {centerX: midPoint[0], bottom: midPoint[1]};
            } else {
                pos = {left: midPoint[0], bottom: midPoint[1]};
            }

            this._renderText(params, label, pos);
        }
    }

    /**
     * Mark the point at `pos` on the plot, giving it a label `label` if set
     *
     * The label is just positioned below and to the right of the point,
     * there's no collision logic. If more precision is needed, use the
     * <math-plot-text> element to label.
     * 
     * @param  {Object} params Point/label parameters, @see _renderLine
     * @param  {Array}  pos    The position of the point being plotted
     * @param  {String} label  (Optional) A text label for the point
     */
    plotPoint(params, pos, label) {
        // Can't transform canvas because if x and y scales aren't the same the
        // point will be deformed. Instead, calculate point position in canvas
        // coordinates.
        let xPosCanvasCoords = this.center.x + pos[0] * this.unitSize.x;
        let yPosCanvasCoords = this.center.y - pos[1] * this.unitSize.y;
        let parms = Object.assign({}, DEFAULT_PLOT_PARAMETERS, params);

        this.context.beginPath();
        this.context.arc(xPosCanvasCoords, yPosCanvasCoords, POINTRADIUS, 0,
                         2*Math.PI);
        this.context.fillStyle = parms.color;
        this.context.fill();

        if(label !== null) {
            let position = {left: pos[0], top: pos[1]};

            this._renderText(params, label, position);
        }
    }

    /**
     * Given a position `pos` and a string `text`, render `text` at `pos`
     * 
     * @param  {Object} params Line parameters, @see _renderLine
     * @param  {String} text   The text to be rendered
     * @param  {Object} pos    The position of the text, @see _renderText()
     */
    plotText(params, text, pos) {
        this._renderText(params, text, pos);
    }

    /**
     * Called by the various _plot* functions, sets context attributes to
     * either their defauls (defined in DEFAULT_PLOT_PARAMETERS) or their
     * overrides in `parms`, then draws a line.
     *
     * @param  {Object} parms The overriden parameters, @see _getParams
     */
    _renderLine(parms) {
        let params = Object.assign({}, DEFAULT_PLOT_PARAMETERS, parms);

        this.context.lineJoin = "round";
        this.context.lineWidth = params.lineWidth;
        this.context.strokeStyle = params.color;
        this.context.setLineDash(params.lineDash);
        this.context.stroke();
    }

    /**
     * Render the text in `text` at the position described in `pos`.
     * 
     * `pos` is an Object with six different possible properties: bottom,
     * centerY, top, left, centerX, right; but is only required to have (and
     * will only make use of) one of each of the vertical/horizontal
     * properties.
     * 
     * @param  {Object} parms The overriden parameters, @see _getParams
     * @param  {String} text  The text to be rendered
     * @param  {Object} pos   The position at which the text is to be rendered
     */
    _renderText(parms, text, pos) {
        let params = Object.assign({}, DEFAULT_PLOT_PARAMETERS, parms);

        let width = this.context.measureText(text).width;
        let scaledWidth = width / this.scale.x;
        let scaledFontSize = FONTSIZE / this.scale.y;

        //padding from left and bottom, since they otherwise sit too close to
        //the line segments
        let scaledLeftPad = 3 / this.scale.x;
        let scaledBottomPad = 3 / this.scale.y;

        let bottom = null;
        if(pos.hasOwnProperty('top')) {
            bottom = pos.top + scaledFontSize;
        } else if(pos.hasOwnProperty('centerY')) {
            bottom = pos.centerY + scaledFontSize / 2;
        } else if(pos.hasOwnProperty('bottom')) {
            bottom = pos.bottom - scaledBottomPad;
        } else {
            throw new Error('_renderText: pos requires a vertical position.')
        }

        let left = null;
        if(pos.hasOwnProperty('left')) {
            left = pos.left + scaledLeftPad;
        } else if(pos.hasOwnProperty('centerX')) {
            left = pos.centerX - scaledWidth / 2;
        } else if(pos.hasOwnProperty('right')) {
            left = pos.right - scaledWidth;
        } else {
            throw new Error('_renderText: pos requires a horizontal position.')
        }

        let x = left * this.scale.x + this.center.x;
        let y = bottom * this.scale.y + this.center.y;
        this.context.fillStyle = params.color;
        this.context.fillText(text, x, y);
    }
}


/**
 * A WebComponent element which is stritly a child of the <math-plot> element.
 * A <math-plot> element many have many <math-plot-function> children (as well
 *     as many <math-plot-*> children.)
 * Defines a curve which is to be plotted on the MathPlot canvas.
 * Performs no actions itself, just used as a way of easily writing in HTML
 *     the curves to be plotted.
 */
class MathPlotFunction extends HTMLElement {
    /**
     * @constructs
     */
    constructor() {
        super();
    }
}


/**
 * Defines a line to be plotted on the MathPlot canvas.
 * @see  MathPlotFunction
 */
class MathPlotLine extends HTMLElement {
    /**
     * @constructs
     */
    constructor() {
        super();
    }
}


/**
 * Defines a line segment to be plotted on the MathPlot canvas.
 * @see  MathPlotFunction
 */
class MathPlotLineSegment extends HTMLElement {
    /**
     * @constructs
     */
    constructor() {
        super();
    }
}


/**
 * Defines an asymptote to be plotted on the MathPlot canvas.
 * @see  MathPlotFunction
 */
class MathPlotAsymptote extends HTMLElement {
    /**
     * @constructs
     */
    constructor() {
        super();
    }
}


/**
 * Defines a point to be plotted on the MathPlot canvas.
 * @see  MathPlotFunction
 */
class MathPlotPoint extends HTMLElement {
    /**
     * @constructs
     */
    constructor() {
        super();
    }
}


/**
 * Defines a character or string of text to be plotted on the MathPlot canvas.
 * @see  MathPlotFunction
 */
class MathPlotText extends HTMLElement {
    /**
     * @constructs
     */
    constructor() {
        super();
    }
}


customElements.define(TAGNAME, MathPlot);
customElements.define(TAGNAME + '-function', MathPlotFunction);
customElements.define(TAGNAME + '-line', MathPlotLine);
customElements.define(TAGNAME + '-line-segment', MathPlotLineSegment);
customElements.define(TAGNAME + '-asymptote', MathPlotAsymptote);
customElements.define(TAGNAME + '-point', MathPlotPoint);
customElements.define(TAGNAME + '-text', MathPlotText);
