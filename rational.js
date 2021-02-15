const FONTSIZE = 17;

// drawing right at the edge of a space looks off, pad a little
const DRAW_X_OFFSET = 3;
const DRAW_Y_OFFSET = 3;
const DRAW_MINUS_WIDTH = 5;
const DRAW_MINUS_SEPARATION = 3;
const DRAW_TUPLE_PADDING = 5;

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
 * numerator and denominator and an optional number recording the multiplicty
 * of pi piFactor.
 */
class Rational {
    /**
     * Creates a new Rational, a rational number. Numerator and denominator
     * must both be integers, though denominator is optional.
     *
     * NOTE: This class doesn't actually implement rationals, it implements
     * rationals with a multiple of pi OR a multiple of e:
     *     (a/b)*(s^c)    a, b, c \in Z,  s \in {\pi, e}
     * It should be renamed but I don't know what to rename it to.
     *
     * Rationals can be created with a number of syntaxes:
     *     new Rational(1, 2)       // => 1/2
     *     new Rational("1", "2")   // => 1/2
     *     new Rational(1, 2, 1)    // => pi/2
     *     new Rational("pi", 2)    // => pi/2
     *     new Rational("e", 2)    // => e/2
     *     new Rational("pi/2")     // => pi/2
     *     new Rational("e/2")     // => e/2
     *     new Rational(0.5)       // => 1/2
     * pi/e are also strictly supported in the denominator, but that can't be
     * used for anything useful at the moment.
     * using a float argument is supported, but will only work if the mantissa
     * is <= 9 figures long
     *
     * piFactor allows the Rational to be multiplied by some power of pi.
     * Necessary because axes sometimes need to be multiples of pi. It's poorly
     * supported and probably a bit overengineered, but I preferred a genuine
     * representation of the number to a kludge for allowing pi multiples for
     * units.
     * 
     * eFactor allows the Rational to be multiplied by some power of e.
     * Necessary to support exponential functions.
     * 
     * @constructs
     * @param  {Number|String} numerator   The numerator of the rational
     * @param  {Number|String} denominator The denominator of the rational
     * @param  {Number} piFactor           Rational multiplied by pi^piFactor
     * @param  {Number} eFactor            Rational multiplied by e^eFactor
     * @return {Rational}                  A new Rational object
     */
    constructor(numerator, denominator=1, piFactor=0, eFactor=0) {
        //must go first because numerator/denominator can alter it
        this.piFactor = piFactor;
        this.eFactor = eFactor;

        //e.g. new Rational("1/2")
        if(typeof numerator === 'string') {
            let matches = numerator.match(/^(.+)\/(.+)$/);
            if(matches !== null) {
                [numerator, denominator] = matches.slice(1);
            }
        }

        // if numerator is a float
        if(Number(numerator) === numerator && numerator % 1 !== 0) {
            let rounded = Math.round(numerator * 1000000000) / 1000000000;
            let roundedString = rounded.toString();

            if(roundedString.indexOf('.') === -1) {
                // if the float is within 1e-9 of an integer
                numerator = rounded;
            } else {
                let mantissaLength = roundedString.split('.')[1].length;
                let mult = Math.pow(10, mantissaLength);

                numerator = rounded * mult;
                denominator = mult;
            }
        }

        let num = this._parseInput(numerator);
        this.numerator = num.mult;
        this.piFactor += num.pi;
        this.eFactor += num.e;

        let denom = this._parseInput(denominator);
        this.denominator = denom.mult;
        this.piFactor -= denom.pi;
        this.eFactor -= denom.e;

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

            return {mult: number, pi: 0, e: 0};
        } else if(typeof number === 'string') {
            assert(number !== '', 'Invalid number:' + number)
            let pattern = /^(-)?([0-9]+)?(pi|e)?$/
            let matches = number.match(pattern);
            assert(matches !== null, 'Invalid number:' + number);

            let [neg, multStr, symbolStr] = matches.slice(1);
            let mult = typeof multStr !== 'undefined' ? parseInt(multStr) : 1;

            let pi = 0;
            let e = 0;
            if(typeof symbolStr !== 'undefined') {
                if(symbolStr === 'pi') {
                    pi = 1;
                } else if(symbolStr === 'e') {
                    e = 1;
                }
            }

            if(typeof neg !== 'undefined') {
                mult *= -1;
            }

            return {mult: mult, pi: pi, e: e};
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
        return (this.numerator * Math.PI**this.piFactor * Math.E**this.eFactor) / this.denominator;
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

        if(this.piFactor !== number.piFactor || this.eFactor !== number.eFactor) {
            throw new Error('Adding of numbers with different symbol factors not supported.')
        }

        let ret = new Rational(
            this.numerator * number.denominator + number.numerator * this.denominator,
            this.denominator * number.denominator,
            this.piFactor,
            this.eFactor);

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

        if(this.piFactor !== number.piFactor || this.eFactor !== number.eFactor) {
            throw new Error('Subtracting of numbers with different symbol factors not supported.')
        }

        let ret = new Rational(
            this.numerator * number.denominator - number.numerator * this.denominator,
            this.denominator * number.denominator,
            this.piFactor,
            this.eFactor);

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

        // Though this wouldn't cause any mathematical problems, numbers with
        // both pi and e factors aren't generally supported by the class (e.g.
        // _parseInput() won't parse both simultaneously), so best not to
        // allow it here to save possible confusion.
        if((this.piFactor !== 0 && number.eFactor !== 0) ||
                (this.eFactor !== 0 && number.piFactor !== 0)) {
            throw new Error('Multiplying of numbers with different symbols not supported.')
        }

        let ret = new Rational(
            this.numerator * number.numerator,
            this.denominator * number.denominator,
            this.piFactor + number.piFactor,
            this.eFactor + number.eFactor);

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

        // Though this wouldn't cause any mathematical problems, numbers with
        // both pi and e factors aren't generally supported by the class (e.g.
        // _parseInput() won't parse both simultaneously), so best not to
        // allow it here to save possible confusion.
        if((this.piFactor !== 0 && number.eFactor !== 0) ||
                (this.eFactor !== 0 && number.piFactor !== 0)) {
            throw new Error('Dividing of numbers with different symbols not supported.')
        }

        let ret = new Rational(
            this.numerator * number.denominator,
            this.denominator * number.numerator,
            this.piFactor - number.piFactor,
            this.eFactor - number.eFactor);

        ret.simplify();
        return ret;
    }

    /**
     * Raises this Rational to the power of an integer or a Rational. Returns
     * the result, but does not mutate this object.
     *
     * NOTE: The exponent must be an integer, or a Rational with denominator 1
     *
     * @param  {Number|Rational} number The number by which to raise `this`
     * @return {Rational}               The resulting exponent
     */
    power(number) {
        if(!(number instanceof Rational)) {
            number = new Rational(number);
        }

        // Only raising to an integer is supported
        if(number.denominator !== 1 || number.eFactor !== 0 || number.piFactor !== 0) {
            throw new Error('Raising to a non-integer power is not supported.')
        }

        let ret = new Rational(
            this.numerator ** number.numerator,
            this.denominator ** number.numerator,
            this.piFactor * number.numerator,
            this.eFactor * number.numerator);

        ret.simplify();
        return ret;
    }

    /**
     * Returns the absolute value of this Rational as a new Rational, but does
     * not mutate this object.
     * 
     * @return {Rational}  The absolute value of this Rational
     */
    abs() {
        let ret = new Rational(
            this.numerator,
            this.denominator,
            this.piFactor,
            this.eFactor);

        ret.simplify();
        ret.numerator = Math.abs(ret.numerator);
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
            ((this.piFactor == number.piFactor && this.eFactor == number.eFactor) || this.numerator == 0));
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
     * Get the width of the Rational when drawn on a canvas `context`
     * 
     * @param  {CanvasRenderingContext2D} context The rendering canvas' context
     * @return {Number}                           The width of the Rational, in
     *                                            canvas dimensions
     */
    getDrawWidth(context) {
        let numLabel = Math.abs(this.numerator).toString();
        if(this.piFactor === 1) {
            numLabel = (numLabel === '1' ? 'π' : numLabel + 'π');
        } else if(this.eFactor === 1) {
            numLabel = (numLabel === '1' ? 'e' : numLabel + 'e');
        }

        let minusPadding = this.lessThan(0) ?
                               DRAW_MINUS_WIDTH + DRAW_MINUS_SEPARATION : 0;

        if(this.denominator === 1) {
            return context.measureText(numLabel).width + minusPadding;
        } else {
            let denomLabel = this.denominator.toString();

            let numWidth = context.measureText(numLabel).width;
            let denomWidth = context.measureText(denomLabel).width;

            return Math.max(numWidth, denomWidth) + minusPadding;
        }
    }

    /**
     * Get the height of the Rational when drawn on a canvas `context`
     * 
     * @param  {CanvasRenderingContext2D} context The rendering canvas' context
     * @return {Number}                           The height of the Rational,
     *                                            in canvas dimensions
     */
    getDrawHeight(context) {
        if(this.denominator === 1) {
            return FONTSIZE;
        } else {
            return FONTSIZE * 2;
        }
    }

    /**
     * Draw the Rational on the canvas at the position described by `position`.
     * 
     * - `position` must define top, and may define either left or right.
     * - `areFractions` is used by the x axis labels, and if true indicates
     *   that some of the labels are fractions. If true, it draws integral
     *   labels slightly lower so they line up with the fractional labels.
     * 
     * @param  {CanvasRenderingContext2D} context The rendering canvas' context
     * @param  {Object}  position     The position to draw the number
     * @param  {Boolean} areFractions Are any of the other labels on the axis
     *                                fractions?
     * @param  {String}  color        The color to draw the number
     */
    draw(context, position, areFractions=false, color='#000000') {
        context.fillStyle = color;
        context.strokeStyle = color;

        let numLabel = Math.abs(this.numerator).toString();
        if(this.piFactor === 1) {
            numLabel = (numLabel === '1' ? 'π' : numLabel + 'π');
        } else if(this.eFactor === 1) {
            numLabel = (numLabel === '1' ? 'e' : numLabel + 'e');
        }
        let denomLabel = this.denominator.toString();

        let numWidth = context.measureText(numLabel).width;
        let denomWidth = context.measureText(denomLabel).width;

        let width = this.getDrawWidth(context);
        // the width of the fraction without the negative sign
        let fracWidth = this.lessThan(0) ?
            width - DRAW_MINUS_WIDTH - DRAW_MINUS_SEPARATION : width;

        //we need left and top to draw
        if(position.hasOwnProperty('left')) {
            var left = position.left + DRAW_X_OFFSET;
        } else if(position.hasOwnProperty('right')) {
            var left = position.right - width - DRAW_X_OFFSET;
        } else {
            throw new Error('Position must have either left or right defined.');
        }

        // the numbers in a negative need to be drawn further to the right to
        // leave space for the negative sign. So that positives and negatives
        // can be handled by the same code, if the number is negative shift the
        // `left` position by the size of the negative sign.
        if(this.lessThan(0)) {
            left += DRAW_MINUS_WIDTH + DRAW_MINUS_SEPARATION
        }

        if(position.hasOwnProperty('top')) {
            var top = position.top;
        } else {
            throw new Error('Position must have top defined.');
        }

        if(this.denominator === 1) {
            let posX = left;
            let posY = top;

            if(areFractions) {
                posY += FONTSIZE / 2;
            }

            context.fillText(numLabel, posX, posY);
        } else {
            let posX = left + (fracWidth - numWidth) / 2;
            let posY = top;
            context.fillText(numLabel, posX, posY);

            posX = left + (fracWidth - denomWidth) / 2;
            posY = top + FONTSIZE;
            context.fillText(denomLabel, posX, posY);

            context.beginPath();
            context.lineWidth = 1;
            context.moveTo(left, top + FONTSIZE);
            context.lineTo(left + fracWidth, top + FONTSIZE);
            context.stroke();
        }

        //draw negative sign
        let signRight =  left - DRAW_MINUS_SEPARATION;
        if(this.numerator < 0) {
            context.beginPath();
            context.lineWidth = 1;
            if(areFractions || this.denominator !== 1) {
                context.moveTo(signRight - DRAW_MINUS_WIDTH, top + FONTSIZE);
                context.lineTo(signRight, top + FONTSIZE);
            } else {
                context.moveTo(signRight - DRAW_MINUS_WIDTH, top + FONTSIZE / 2);
                context.lineTo(signRight, top + FONTSIZE / 2);
            }
            context.stroke();
        }
    }
}


/**
 * A class for manipulating tuples of rational numbers.
 *
 * @see Rational
 */
class RationalTuple {
    /**
     * Creates a new RationalTuple, a tuple of rational numbers (implemented as
     * an array of class Rational).
     *
     * Takes as its only argument either:
     *     - a string `tuple` of the form "(a, b, ...)" as its only argument.
     *       e.g.:
     *           "(1/2, pi, 3pi)"
     *     - an array of Rationals
     *
     * @see  Rational
     * 
     * @constructs
     * @param  {String|Array}   tuple  A string representation of the tuple of
     *                                 rationals, or an array of Rationals
     * @return {RationalTuple}  A new RationalTuple object
     */
    constructor(tuple) {
        if(Array.isArray(tuple)) {
            this._tuple = tuple;
        } else {
            tuple = tuple.replace(/\s/g, '');
            assert(/^\([^(),]+(,[^(),]+)*\)$/.test(tuple),
                   "Invalid tuple provided.");

            let matches = tuple.slice(1, -1).split(',');
            this._tuple = matches.map(el => new Rational(el));
        }
    }

    /** GETTERS AND SETTERS */

    /**
     * Returns an array of floating-point approximations of the Rationals in
     * the tuple.
     *
     * @return {Array} An array of floating-point approximations
     */
    get approx() {
        return this._tuple.map(rat => rat.approx);
    }

    /**
     * Returns the length of `_tuple`, which is the number of elements in the
     * tuple.
     * 
     * @return {Number} The number of Rationals in the tuple
     */
    get length() {
        return this._tuple.length
    }

    /**
     * Get the width of the RationalTuple when drawn on a canvas `context`
     * 
     * @param  {CanvasRenderingContext2D} context The rendering canvas' context
     * @return {Number}                           The width of the Tuple, in
     *                                            canvas dimensions
     */
    getDrawWidth(context) {
        // Measure the width of all elements in the tuple besides the Rationals
        // themselves
        let rationalHeights
            = this._tuple.map((rat) => rat.getDrawHeight(context));
        let tupleFontsize = Math.max(...rationalHeights);

        let tupleElementCount = this._tuple.length;
        let tupleChars = '()' + ','.repeat(tupleElementCount - 1);

        context.font = tupleFontsize + 'px serif';
        let tupleCharWidth = context.measureText(tupleChars).width;
        context.font = FONTSIZE + 'px serif';

        // Measure the widths of the Rationals
        let rationalWidths = this._tuple.map((x) => x.getDrawWidth(context));

        // Measure the widths of the padding between Rationals
        let rationalPadding = DRAW_TUPLE_PADDING * tupleElementCount;

        // Sum everything together
        let drawWidth = tupleCharWidth + rationalPadding +
                        rationalWidths.reduce((x, y) => x + y);

        return drawWidth;
    }

    /** MISCELLANEOUS */

    /**
     * Draw the text `content`, at size `fontsize`, on the canvas context
     * `context`.
     *
     * Returns an updated `position` object, so the next element can be drawn
     * in the right place.
     *
     * @see  draw()
     * 
     * @param  {CanvasRenderingContext2D} context  The rendering canvas'
     *                                             context
     * @param  {Object}                   position The position to draw
     *                                             `content`
     * @param  {Number}                   fontsize The font size to draw
     *                                             `content`
     * @param  {String}                   content  The string to be drawn
     * @return {Object}                            The new position
     */
    _drawAddOuterText(context, position, fontsize, content) {
        context.font = fontsize + 'px serif';
        context.fillText(content, position.left, position.top);

        position.left += context.measureText(content).width;
        context.font = FONTSIZE + 'px serif';

        return position;
    }

    /**
     * Draw the RationalTuple on the canvas at the position described by
     * `position`.
     * 
     * - `position` must define either top or bottom, and either left or right.
     * 
     * @param  {CanvasRenderingContext2D} context   The rendering canvas'
     *                                              context
     * @param  {Object}                   position  The position to draw the
     *                                              tuple
     * @param  {String}                   color     The color of the tuple
     */
    draw(context, position, color='#000000') {
        context.fillStyle = color;

        let areFractions
            = this._tuple.filter((rat) => rat.denominator != 1).length > 0;

        let rationalHeights
            = this._tuple.map((rat) => rat.getDrawHeight(context));
        let tupleFontsize = Math.max(...rationalHeights);

        if(!('left' in position)) {
            if('right' in position) {
                position.left = position.right - this.getDrawWidth(context);
            } else {
                throw new Error('Position must have either left or right defined.');
            }
        }

        if(!('top' in position)) {
            if('bottom' in position) {
                position.top = position.bottom - tupleFontsize;
            } else {
                throw new Error('Position must have either top or bottom defined.');
            }
        }

        let curPos = position;
        curPos = this._drawAddOuterText(context, position, tupleFontsize, '(');

        let self = this;
        let first = true;
        this._tuple.forEach(function(rational) {
            if(first) {
                first = false;
            } else {
                curPos = self._drawAddOuterText(context, position,
                                                tupleFontsize, ',');
            }

            rational.draw(context, curPos, areFractions, color);
            curPos.left += rational.getDrawWidth(context) + DRAW_TUPLE_PADDING;
        });

        this._drawAddOuterText(context, position, tupleFontsize, ')');
    }
}

export {Rational, RationalTuple};
