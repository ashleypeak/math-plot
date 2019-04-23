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
 * A class for manipulating rational numbers. Stored as a pair of integers
 * numerator and denominator.
 */
class Rational {
    /**
     * Creates a new Rational, a rational number. Numerator and denominator
     * must both be integers, though denominator is optional.
     *
     * Rationals can be created with a number of syntaxes:
     *     new Rational(1, 2)       // => 1/2
     *     new Rational("1", "2")   // => 1/2
     *     new Rational(1, 2, 1)    // => pi/2
     *     new Rational("pi", 2)    // => pi/2
     *     new Rational("pi/2")     // => pi/2
     * pi is also strictly supported in the denominator, but that can't be used
     * for anything useful at the moment.
     *
     * piFactor allows the Rational to be multiplied by some power of pi.
     * Necessary because axes sometimes need to be multiples of pi. It's poorly
     * supported and probably a bit overengineered, but I preferred a genuine
     * representation of the number to a kludge for allowing pi multiples for
     * units.
     * 
     * @constructs
     * @param  {Number|String} numerator   The numerator of the rational
     * @param  {Number|String} denominator The denominator of the rational
     * @param  {Number} piFactor           Rational multiplied by pi^piFactor
     * @return {Rational}                  A new Rational object
     */
    constructor(numerator, denominator=1, piFactor=0) {
        //must go first because numerator/denominator can alter it
        this.piFactor = piFactor;

        //e.g. new Rational("1/2")
        if(typeof numerator === 'string') {
            let matches = numerator.match(/^(.+)\/(.+)$/);
            if(matches !== null) {
                [numerator, denominator] = matches.slice(1);
            }
        }

        let num = this._parseInput(numerator);
        this.numerator = num.mult;
        this.piFactor += num.pi;

        let denom = this._parseInput(denominator);
        this.denominator = denom.mult;
        this.piFactor -= denom.pi;

        this.simplify();
    }

    /**
     * Given a number in one of the formats described below, return an Object
     * of the form {mult:..., pi:...}, where `mult` is an INT, the non-pi
     * value of the number, and `pi` is an INT, the multiplicity of pi (always
     * 1 or 0).
     *
     * Formats:
     *     int:    e.g. 1
     *     string: e.g. "1" | "1.3" | "-pi" | "-2pi"
     * 
     * 
     * @param  {Number|String} number The number to be processed
     * @return {Object}               The parsed number, described above
     */
    _parseInput(number) {
        if(typeof number === 'number') {
            assert(number === parseInt(number), 'Invalid number:' + number);

            return {mult: number, pi: 0};
        } else if(typeof number === 'string') {
            assert(number !== '', 'Invalid number:' + number)
            let pattern = /^(-)?([0-9]+)?(pi)?$/
            let matches = number.match(pattern);
            assert(matches !== null, 'Invalid number:' + number);

            let [neg, multStr, piStr] = matches.slice(1);
            let mult = typeof multStr !== 'undefined' ? parseInt(multStr) : 1;
            let pi = typeof piStr !== 'undefined' ? 1 : 0;

            if(typeof neg !== 'undefined') {
                mult *= -1;
            }

            return {mult: mult, pi: pi};
        } else {
            throw new Error('Invalid number:' + number);
        }
    }


    /** GETTERS AND SETTERS */

    /**
     * Returns a floating-point approximation of the Rational.
     * 
     * @return {Number} A floating-point approximation
     */
    get approx() {
        return (this.numerator * Math.PI**this.piFactor) / this.denominator;
    }

    /** OPERATORS */

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

        if(this.piFactor !== number.piFactor) {
            throw new Error('Adding of numbers with different pi factors not supported.')
        }

        let ret = new Rational(
            this.numerator * number.denominator + number.numerator * this.denominator,
            this.denominator * number.denominator,
            this.piFactor);

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

        if(this.piFactor !== number.piFactor) {
            throw new Error('Subtracting of numbers with different pi factors not supported.')
        }

        let ret = new Rational(
            this.numerator * number.denominator - number.numerator * this.denominator,
            this.denominator * number.denominator,
            this.piFactor);

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
            this.denominator * number.denominator,
            this.piFactor + number.piFactor);

        ret.simplify();
        return ret;
    }

    /**
     * Divides this Rational by an integer or a Rational. Returns the result,
     * but does not mutate this object.
     * 
     * @param  {Number|Rational} number The number to be divided by
     * @return {Rational}               The product of the two numbers
     */
    divide(number) {
        if(!(number instanceof Rational)) {
            number = new Rational(number);
        }

        let ret = new Rational(
            this.numerator * number.denominator,
            this.denominator * number.numerator,
            this.piFactor - number.piFactor);

        ret.simplify();
        return ret;
    }

    /**
     * Tests if `this` is equal to `number`.
     * 
     * @param  {Number|Rational} number The number to be compared
     * @return {Boolean}                True if `this` = `number`
     */
    equal(number) {
        if(!(number instanceof Rational)) {
            number = new Rational(number);
        }

        return (this.numerator == number.numerator &&
            this.denominator == number.denominator &&
            (this.piFactor == number.piFactor || this.numerator == 0));
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


    /** MISCELLANEOUS */

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
        if(!b) {
            return a;
        }

        return this._gcd(b, a % b);
    }

    /**
     * Draw the Rational on the canvas at the position described by `position`.
     * 
     * - `position` must define top, and may define either left or right.
     * - `areFractions` is used by the x axis labels, and if true indicates
     *   that some of the labels are fractions. If true, it draws integral
     *   labels slightly lower so they line up with the fractional labels.
     * 
     * @param  {CanvasRenderingContext2D} context The rendering anvas' context
     * @param  {Object}  position     The position to draw the number
     * @param  {Boolean} areFractions Are any of the other labels on the axis
     *                                fractions?
     */
    draw(context, position, areFractions=false) {
        let numLabel = Math.abs(this.numerator).toString();
        if(this.piFactor === 1) {
            numLabel = (numLabel === '1' ? 'π' : numLabel + 'π');
        }

        if(this.denominator === 1) {
            var width = context.measureText(numLabel).width;
        } else {
            var denomLabel = this.denominator.toString();

            var numWidth = context.measureText(numLabel).width;
            var denomWidth = context.measureText(denomLabel).width;

            var width = Math.max(numWidth, denomWidth);
        }

        //we need left and top to draw
        if(position.hasOwnProperty('left')) {
            var left = position.left + 5;
        } else if(position.hasOwnProperty('right')) {
            var left = position.right - width - 5;
        } else {
            throw new Error('Position must have either left or right defined.');
        }

        if(position.hasOwnProperty('top')) {
            var top = !areFractions ? position.top : position.top - 3;
        } else {
            throw new Error('Position must have top defined.');
        }

        if(this.denominator === 1) {
            let posX = left;
            let posY = top + FONTSIZE;

            if(areFractions) {
                posY += FONTSIZE / 2;
            }

            context.fillText(numLabel, posX, posY);
        } else {
            let posX = left + (width - numWidth) / 2;
            let posY = top + FONTSIZE;
            context.fillText(numLabel, posX, posY);

            posX = left + (width - denomWidth) / 2;
            posY = top + 2 * FONTSIZE;
            context.fillText(denomLabel, posX, posY);

            context.beginPath();
            context.lineWidth = 1;
            context.moveTo(left - 2, top + FONTSIZE + 3);
            context.lineTo(left + width + 2, top + FONTSIZE + 3);
            context.stroke();
        }

        //draw negative sign
        let signRight = this.denominator === 1 ? left - 3 : left - 6;
        if(this.numerator < 0) {
            context.beginPath();
            context.lineWidth = 1;
            if(areFractions) {
                context.moveTo(signRight - 5, top + FONTSIZE + 3);
                context.lineTo(signRight, top + FONTSIZE + 3);
            } else {
                context.moveTo(signRight - 5, top + FONTSIZE / 2 + 3);
                context.lineTo(signRight, top + FONTSIZE / 2 + 3);
            }
            context.stroke();
        }
    }

    /**
     * Given a range of the form "(min, max)", return an object of the form
     * {min: Rational, max: Rational}
     * 
     * @param  {String} range A string representation of the range
     * @return {Object}       The parsed range
     */
    static parseRange(range) {
        range = range.replace(/\s/g, '');
        let matches = range.match(/^\((.+),(.+)\)$/);
        assert(matches !== null, "Invalid range provided.");

        let [min, max] = matches.slice(1).map(el => new Rational(el));

        assert(min.lessThan(max), "First term of range must be smaller than second.");
        return {min: min, max: max};
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
            new Rational(this.getAttribute('step-x')) : null;
        this.stepY = this.getAttribute('step-y') ?
            new Rational(this.getAttribute('step-y')) : null;
        this.drawXUnits = this.getAttribute('hide-x-units') !== null ? false : true;
        this.drawYUnits = this.getAttribute('hide-y-units') !== null ? false : true;

        let rangeXRational =
            Rational.parseRange(this.getAttribute('range-x') || "(-10, 10)");
        let rangeYRational =
            Rational.parseRange(this.getAttribute('range-y') || "(-10, 10)");
        this.range = {
            x: {min: rangeXRational.min.approx, max: rangeXRational.max.approx},
            y: {min: rangeYRational.min.approx, max: rangeYRational.max.approx},
        }
        this.range.x.size = this.range.x.max - this.range.x.min;
        this.range.y.size = this.range.y.max - this.range.y.min;

        this.gutter = {
            left: parseInt(this.getAttribute('gutter-left')) || 20,
            right: parseInt(this.getAttribute('gutter-right')) || 20,
            top: parseInt(this.getAttribute('gutter-top')) || 20,
            bottom: parseInt(this.getAttribute('gutter-bottom')) || 20
        }
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
            right: this.width - this.gutter.right - drawLabelWidth,
            top: this.gutter.top + drawLabelHeight,
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

        //the size, in graph coords, of the drawRegion (see below)
        let drawRangeX = this.range.x.size *
            ((this.main.width + this.gutter.left + this.gutter.right) /
                this.main.width);
        let drawRangeY = this.range.y.size *
            ((this.main.height + this.gutter.top + this.gutter.bottom) /
                this.main.height);

        //the size of each axis' gutters in graph coords
        let gutterRangeX = (drawRangeX - this.range.x.size);
        let gutterRangeY = (drawRangeY - this.range.y.size);

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
        this.drawRegion.width = this.drawRegion.right - this.drawRegion.left;
        this.drawRegion.height = this.drawRegion.top - this.drawRegion.bottom;

        //one unit of graph units, in canvas coords (pixels)
        this.scale = {
            x: (this.width - drawLabelWidth) / this.drawRegion.width,
            y: -(this.height - drawLabelHeight) / this.drawRegion.height
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

            this.draw(func);
        }
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

            this._drawLine(this.center.x, LABELHEIGHT + 10, this.center.x,
                this.height, 2);

            this.context.beginPath();
            this.context.lineWidth = 1;
            this.context.moveTo(this.center.x, LABELHEIGHT);
            this.context.lineTo(this.center.x + 5, LABELHEIGHT + 10);
            this.context.lineTo(this.center.x - 5, LABELHEIGHT + 10);
            this.context.fill();

            if(this.drawYUnits) {
                //don't draw unit markings over the 10px arrowhead at the top
                //of the y axis (or in the same region at the bottom for good
                //measure).
                let drawTop = this.drawRegion.top + 10 / this.scale.y;
                let drawBottom = this.drawRegion.bottom - 10 / this.scale.y;

                let stepSize = this.stepY;
                let i = stepSize.times(Math.ceil(drawBottom / stepSize.approx));
                for(; i.lessThan(drawTop); i = i.plus(stepSize)) {
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

            this._drawLine(0, this.center.y, this.width - LABELWIDTH - 10, this.center.y, 2);

            this.context.beginPath();
            this.context.lineWidth = 1;
            this.context.moveTo(this.width - LABELWIDTH, this.center.y);
            this.context.lineTo(this.width - LABELWIDTH - 10, this.center.y + 5);
            this.context.lineTo(this.width - LABELWIDTH - 10, this.center.y - 5);
            this.context.fill();

            if(this.drawXUnits) {
                //don't draw unit markings over the 10px arrowhead at the right
                //of the x axis (or in the same region at the left for good
                //measure).
                let drawLeft = this.drawRegion.left + 10 / this.scale.x;
                let drawRight = this.drawRegion.right - 10 / this.scale.x;

                let stepSize = this.stepX;
                let xMin = this.range.x.min
                let i = stepSize.times(Math.ceil(drawLeft / stepSize.approx));
                for(; i.lessThan(drawRight); i = i.plus(stepSize)) {
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
                assert(node.textContent === 'x', '<ci> can only take \'x\' in <' + TAGNAME + '>.')

                return (x => x);
            case 'cn':
                assert(/^-?[0-9]+(\.[0-9]+)?$/.test(node.textContent), '<cn> must contain a number.');

                return (x => parseFloat(node.textContent));
            case 'degree':
                return this._parseMathMLNode(node.firstChild);
            case 'pi':
                return (x => Math.PI);
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
        assert(node.childElementCount >= 2, "<apply> must have at least two children.")

        let action = node.firstChild.tagName;
        let argNodes = Array.from(node.children).slice(1);
        let args = argNodes.map(this._parseMathMLNode, this);

        switch(action) {
            case 'plus':
                this._assertChildren(node, 3);
                return ((x) => args[0](x) + args[1](x));
            case 'minus':
                this._assertChildren(node, 3);
                return ((x) => args[0](x) - args[1](x));
            case 'times':
                this._assertChildren(node, 3);
                return ((x) => args[0](x) * args[1](x));
            case 'divide':
                this._assertChildren(node, 3);
                return ((x) => args[0](x) / args[1](x));
            case 'power':
                this._assertChildren(node, 3);
                return ((x) => args[0](x) ** args[1](x));
            case 'root':
                this._assertChildren(node, 3);
                return ((x) => args[1](x) ** (1 / args[0](x)));
            case 'sin':
                this._assertChildren(node, 2);
                return ((x) => Math.sin(args[0](x)));
            case 'cos':
                this._assertChildren(node, 2);
                return ((x) => Math.cos(args[0](x)));
            case 'tan':
                this._assertChildren(node, 2);
                return ((x) => Math.tan(args[0](x)));
            default:
                throw new Error('Unknown <apply> action: ' + action);
        }
    }

    _assertChildren(node, count) {
        let action = node.firstChild,tagName;
        assert(node.childElementCount === count,
            '<apply><' + action + '/> must have three children.')
    }

    /**
     * Given a (JavaScript) function `func`, which will convert an x coordinate
     * into the appropriate y coordinate for a (mathematical) function, plot
     * the curve of said mathematical function.
     * 
     * @param  {Function} func A JS function describing the curve to be plotted
     */
    draw(func) {
        //the distance in graph coords equal to a pixel, inverse of scale.x
        let drawStep = 1 / this.scale.x;

        this.context.save();
            this.context.translate(this.center.x, this.center.y);       //move (0,0) to graph centre
            this.context.scale(this.scale.x, this.scale.y);            //change scale from pixels to graph units, and invert y axis
            
            this.context.beginPath();
            this.context.moveTo(this.drawRegion.left, func(this.drawRegion.left));
            
            let prevY = func(this.drawRegion.left);
            for(var x = this.drawRegion.left; x <= this.drawRegion.right; x += drawStep) {
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
        this.context.restore();
        
        this.context.lineJoin = "round";
        this.context.lineWidth = 2;
        this.context.stroke();
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