const FONTSIZE = 17;

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
     * rationals with a multiple of pi:
     *     (a/b)*(pi^c)    a, b, c \in Z
     * It should be renamed but I don't know what to rename it to.
     *
     * Rationals can be created with a number of syntaxes:
     *     new Rational(1, 2)       // => 1/2
     *     new Rational("1", "2")   // => 1/2
     *     new Rational(1, 2, 1)    // => pi/2
     *     new Rational("pi", 2)    // => pi/2
     *     new Rational("pi/2")     // => pi/2
     *     new Rational(0.5)       // => 1/2
     * pi is also strictly supported in the denominator, but that can't be used
     * for anything useful at the moment.
     * using a float argument is supported, but will only work if the mantissa
     * is <= 9 figures long
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

        // if numerator is a float
        if(Number(numerator) === numerator && numerator % 1 !== 0) {
            let rounded = Math.round(numerator * 1000000000) / 1000000000;
            let mantissaLength = rounded.toString().split('.')[1].length;
            let mult = Math.pow(10, mantissaLength);

            numerator = rounded * mult;
            denominator = mult;
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
}

export {Rational, RationalTuple};
