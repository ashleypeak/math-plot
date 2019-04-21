const TAGNAME = 'math-plot';
const LABELWIDTH = 15;
const LABELHEIGHT = 21;
const FONTSIZE = 17;
const MINSTEPSIZE = 40;
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
    <canvas id='canvas' class='canvas'></canvas>
`;


/**
 * A class for manipulating rational numbers. Stored as a pair of integers
 * numerator and denominator.
 */
class Rational {
    /**
     * Creates a new Rational, a rational number. Numerator and denominator
     * must both be integers, though denominator is optional.
     * 
     * @constructs
     * @param  {Number} numerator   The numerator of the rational
     * @param  {Number} denominator The denominator of the rational
     * @return {Rational}             A new Rational object
     */
    constructor(numerator, denominator=1) {
        if(typeof numerator !== 'number' || numerator !== parseInt(numerator) ||
            typeof denominator !== 'number' || denominator !== parseInt(denominator) ||
            denominator === 0) {
            throw new Error('Invalid Rational');
        }

        this.numerator = numerator;
        this.denominator = denominator;
    }

    /**
     * Returns a floating-point approximation of the Rational.
     * 
     * @return {Number} A floating-point approximation
     */
    get approx() {
        return this.numerator / this.denominator;
    }

    /**
     * Ensures numerator and denominator are coprime, and denominator is not
     * negative. Returns nothing.
     */
    simplify() {
        let gcd = this._gcd(this.numerator, this.denominator);

        this.numerator /= gcd;
        this.denominator /= gcd;

        if(this.denominator < 0) {
            this.numerator *= -1;
            this.denominator = Math.abs(this.denominator);
        }
    }

    /**
     * Find the greatest common divisor of _integers_ `a` and `b`.
     * 
     * @param  {Number} a An integer
     * @param  {Number} b An integer
     * @return {Number}   The GCD of `a` and `b`
     */
    _gcd(a, b) {
        if(b == 0) {
            return a;
        }

        return this._gcd(b, a % b);
    }

    /**
     * Adds an integer or Rational to this Rational. Returns the sum, but does
     * not mutate this object.
     * 
     * @param  {Number|Rational} number The number to be added
     * @return {Rational}               The sum of the two numbers
     */
    plus(number) {
        if(!(number instanceof Rational)) {
            number = new Rational(number);
        }

        let ret = new Rational(
            this.numerator * number.denominator + number.numerator * this.denominator,
            this.denominator * number.denominator);

        ret.simplify();
        return ret;
    }

    /**
     * Subtracts an integer or Rational from this Rational. Returns the result,
     * but does not mutate this object.
     * 
     * @param  {Number|Rational} number The number to be subtracted
     * @return {Rational}               The result fo the subtraction
     */
    minus(number) {
        if(!(number instanceof Rational)) {
            number = new Rational(number);
        }

        let ret = new Rational(
            this.numerator * number.denominator - number.numerator * this.denominator,
            this.denominator * number.denominator);

        ret.simplify();
        return ret;
    }

    /**
     * Multiplies an integer or Rational to this Rational. Returns the product,
     * but does not mutate this object.
     * 
     * @param  {Number|Rational} number The number to be multiplied
     * @return {Rational}               The product of the two numbers
     */
    times(number) {
        if(!(number instanceof Rational)) {
            number = new Rational(number);
        }

        let ret = new Rational(
            this.numerator * number.numerator,
            this.denominator * number.denominator);

        ret.simplify();
        return ret;
    }

    /**
     * Tests if `this` is greater than `number`.
     * 
     * @param  {Number|Rational} number The number to be compared
     * @return {Boolean}                True if `this` > `number`
     */
    greaterThan(number) {
        if(number instanceof Rational) {
            number = number.approx
        }

        return this.approx > number;
    }

    /**
     * Tests if `this` is less than `number`.
     * 
     * @param  {Number|Rational} number The number to be compared
     * @return {Boolean}                True if `this` < `number`
     */
    lessThan(number) {
        if(number instanceof Rational) {
            number = number.approx;
        }

        return this.approx < number;
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
        this.canvas = this.shadowRoot.getElementsByTagName('canvas')[0];
        this.context = this.canvas.getContext('2d');

        //define canvas properties
        this._initDefinedProperties();
        this._initDerivedProperties();

        //intialise canvas
        this.canvas.setAttribute('width', this.width);
        this.canvas.setAttribute('height', this.height);

        //initialise context
        this.context.font = 'italic ' + FONTSIZE + 'px serif';
    }

    /**
     * Collect all properties defined by attributes, or else set them to
     * default values.
     */
    _initDefinedProperties() {
        //initialise graph parameters
        this.width = this.getAttribute('width') || 200;
        this.height = this.getAttribute('height') || 200;
        this.drawXAxis = this.getAttribute('hide-x-axis') !== null ? false : true;
        this.drawYAxis = this.getAttribute('hide-y-axis') !== null ? false : true;
        this.drawGrid = this.getAttribute('show-grid') !== null ? true : false;

        this.range = {
            x: this._parseRange(this.getAttribute('range-x') || "(-10, 10)"),
            y: this._parseRange(this.getAttribute('range-y') || "(-10, 10)")
        }
        this.range.x.size = this.range.x.max - this.range.x.min;
        this.range.y.size = this.range.y.max - this.range.y.min;

        this.gutter = {
            left: this.getAttribute('gutterLeft') || 20,
            right: this.getAttribute('gutterRight') || 20,
            top: this.getAttribute('gutterTop') || 20,
            bottom: this.getAttribute('gutterBottom') || 20
        }
    }

    /**
     * Given a range of the form "(min, max)", return an object of the form
     * {min: FLOAT, max: FLOAT}
     * 
     * @param  {String} range A string representation of the range
     * @return {Object}       The parsed range
     */
    _parseRange(range) {
        range = range.replace(/\s/g, '');

        let rangePattern = /^\((-?[0-9]+(?:\.[0-9]+)?),(-?[0-9]+(?:\.[0-9]+)?)\)$/;
        let matches = range.match(rangePattern);
        this._assert(matches !== null, "Invalid range provided.");

        let [min, max] = matches.slice(1).map(parseFloat);
        this._assert(min < max, "First term of range must be smaller than second.");

        return {min: min, max: max};
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
        //the area, in canvas coords, of the main region (that is, the area
        //bounded in graph coords by this.range)
        this.main = {
            left: this.gutter.left,
            right: this.width - this.gutter.right - (this.drawXAxis ? LABELWIDTH : 0),
            top: this.gutter.top + (this.drawYAxis ? LABELHEIGHT : 0),
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
            y: this.main.top + relativeCentreY * this.main.height
        }

        //the size in pixels of a step of 1 in either axis
        this.unitSize = {
            x: this.main.width / this.range.x.size,
            y: this.main.height / this.range.y.size
        }

        //the size, in graph coords, of the drawRegion (see below)
        let drawRangeX = this.range.x.size *
            ((this.main.width + this.gutter.left + this.gutter.right) /
                this.main.width);
        let drawRangeY = this.range.y.size *
            ((this.main.height + this.gutter.top + this.gutter.bottom) /
                this.main.height);

        //the size of each axis' gutters in graph coords
        let gutterRangeX = (drawRangeX - this.range.x.size) / 2;
        let gutterRangeY = (drawRangeY - this.range.y.size) / 2;

        //the size of each gutter in graph coords
        let gutterLeft = gutterRangeX * (this.gutter.left / (this.gutter.left + this.gutter.right));
        let gutterRight = gutterRangeX * (this.gutter.right / (this.gutter.left + this.gutter.right));
        let gutterTop = gutterRangeY * (this.gutter.top / (this.gutter.top + this.gutter.bottom));
        let gutterBottom = gutterRangeY * (this.gutter.bottom / (this.gutter.top + this.gutter.bottom));

        //the area that needs to be plotted (main and gutters) in graph coords
        this.drawRegion = {
            left: this.range.x.min - gutterLeft,
            right: this.range.x.max + gutterRight,
            top: this.range.y.max + gutterTop,
            bottom: this.range.y.min - gutterBottom
        }
    }

    /**
     * Connected to the DOM. Draw the axes, then all of the curves.
     */
    connectedCallback() {
        this.drawAxes();

        for(let child of this.children) {
            let rule = child.getAttribute('rule');
            let func = this.parseMathML(rule);
        }
    }

    /**
     * Draw the axes of the graph, as well as the unit markers and grid lines.
     * Finally, label all of the unit markers.
     */
    drawAxes() {
        if(this.drawYAxis) {
            this._assert(this.range.x.min <= 0 && this.range.y.max >= 0,
                'Cannot draw the y axis is it is out of range.')

            let labelWidth = this.context.measureText('y').width;

            //has to be fudged to look right
            let labelPosY = FONTSIZE * 4/5;
            let labelPosX = this.center.x - (labelWidth / 2);
            this.context.fillText('y', labelPosX, labelPosY);

            this._drawLine(this.center.x, LABELHEIGHT + 10, this.center.x,
                this.height, 2);

            this.context.beginPath();
            this.context.lineWidth = 1;
            this.context.moveTo(this.center.x, LABELHEIGHT);
            this.context.lineTo(this.center.x + 5, LABELHEIGHT + 10);
            this.context.lineTo(this.center.x - 5, LABELHEIGHT + 10);
            this.context.fill();

            let stepSize = this._getStepSize('y');
            let i = stepSize.times(Math.ceil(this.drawRegion.bottom / stepSize.approx));
            for(; i.lessThan(this.drawRegion.top); i = i.plus(stepSize)) {
                let yPos = this.center.y - i.approx * this.unitSize.y;

                if(this.drawGrid) {
                    this._drawLine(0, yPos, this.width - LABELWIDTH, yPos, 1,
                        [5, 5]);
                }

                this._drawLine(this.center.x, yPos, this.center.x + 6, yPos, 2);
            }
        }

        if(this.drawXAxis) {
            this._assert(this.range.y.min <= 0 && this.range.y.max >= 0,
                'Cannot draw the x axis is it is out of range.')

            let labelWidth = this.context.measureText('x').width;

            //has to be fudged to look right
            let labelPosY = this.center.y + FONTSIZE / 3;
            let labelPosX = this.width - (LABELWIDTH / 2) - (labelWidth / 2);
            this.context.fillText('x', labelPosX, labelPosY);

            this._drawLine(0, this.center.y, this.width - LABELWIDTH - 10, this.center.y, 2);

            this.context.beginPath();
            this.context.lineWidth = 1;
            this.context.moveTo(this.width - LABELWIDTH, this.center.y);
            this.context.lineTo(this.width - LABELWIDTH - 10, this.center.y + 5);
            this.context.lineTo(this.width - LABELWIDTH - 10, this.center.y - 5);
            this.context.fill();

            let stepSize = this._getStepSize('x');
            let xMin = this.range.x.min
            let i = stepSize.times(Math.ceil(this.drawRegion.bottom / stepSize.approx));
            for(; i.lessThan(this.drawRegion.top); i = i.plus(stepSize)) {
                let xPos = this.center.x - i.approx * this.unitSize.x;

                if(this.drawGrid) {
                    this._drawLine(xPos, LABELHEIGHT, xPos, this.height, 1,
                        [5, 5]);
                }

                this._drawLine(xPos, this.center.y, xPos, this.center.y - 6, 2);
            }
        }
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

        let stepSize = 1;
        let stepSizePixels = unitSize * stepSize;

        if(stepSizePixels < MINSTEPSIZE) {
            while(stepSizePixels < MINSTEPSIZE) {
                stepSize++;
                stepSizePixels = unitSize * stepSize;
            }

            return new Rational(stepSize);
        } else {
            let stepSizeDenominator = 1;
            while(stepSizePixels > MINSTEPSIZE) {
                stepSizeDenominator++;
                stepSize = 1 / stepSizeDenominator;
                stepSizePixels = unitSize * stepSize;
            }

            return new Rational(1, stepSizeDenominator - 1);
        }
    }

    /**
     * Given a MathML string, return a function which will perform the
     * described action.
     *
     * Specifically:
     *  - x is the only <ci> allowed in the MathML string.
     *  - Returns a function of the form func(x) which will apply descibed
     *    action. e.g.:
     *        <apply><power/><ci>x</ci><cn>2</cn></apply> will return:
     *        ((x) => x**2)
     *  - MathML can be arbitrarily complex, but must have exactly one
     *    root-level node.
     * 
     * NOTE: Due to limitations on composing functions recursively, the actual
     *       function returned isn't as simple as suggested above, although it
     *       has the same net effect. Highly complex functions may be costly
     *       to run.
     * 
     * @param  {String}   node A MathML <apply> node
     * @return {Function}      A function performing the action described by
     *                         `node`
     */
    parseMathML(rule) {
        let parser = new DOMParser();
        let mathml = parser.parseFromString(rule, 'text/xml');
        let root = mathml.firstChild;

        return this._parseMathMLNode(root);
    }

    /**
     * Parse any MathML node, returning a function which will perform the
     * described action.
     *
     * @see parseMathML
     * @param  {String}   node A MathML <apply> node
     * @return {Function}      A function performing the action described by
     *                         `node`
     */
    _parseMathMLNode(node) {
        switch(node.tagName) {
            case 'apply':
                return this._parseMathMLApply(node);
            case 'ci':
                this._assert(node.textContent === 'x', '<ci> can only take \'x\' in <' + TAGNAME + '>.')

                return (x => x);
            case 'cn':
                this._assert(/^-?[0-9]+(\.[0-9]+)?$/.test(node.textContent), '<cn> must contain a number.');

                return (x => parseFloat(node.textContent));
            default:
                throw new Error('Unknown MathML element: ' + node.tagName);
        }
    }

    /**
     * Parse an <apply> MathML node, returning a function which will perform
     * the <apply> action.
     *
     * @see parseMathML
     * @param  {String}   node A MathML <apply> node
     * @return {Function}      A function performing the action described by
     *                         `node`
     */
    _parseMathMLApply(node) {
        this._assert(node.childElementCount >= 2, "<apply> must have at least two children.")

        let action = node.firstChild.tagName;
        let argNodes = Array.from(node.children).slice(1);
        let args = argNodes.map(this._parseMathMLNode, this);

        switch(action) {
            case 'power':
                this._assert(node.childElementCount === 3, "<apply><times/> must have three children.")
                let [base, exp] = args;

                return ((x) => base(x)**exp(x));
            default:
                throw new Error('Unknown <apply> action: ' + action);
        }
    }

    /**
     * Assert that `condition` is true. If it is not, raise an error with
     * message `message`.
     * 
     * @param  {Boolean} condition The condition being asserted
     * @param  {String} message    The error string to be raised if condition
     *                             is false
     */
    _assert(condition, message) {
        if(!condition) {
            throw new Error(message);
        }
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


customElements.define(TAGNAME, MathPlot);
customElements.define(TAGNAME + '-function', MathPlotFunction);