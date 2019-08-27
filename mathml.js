import {Rational, RationalTuple} from './rational.js';

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


class MathML {
    /**
     * @constructs
     *
     * This class is constructed with a MathML string, which can then be
     * transformed into either:
     *  - a function performing the operation described by the MathML
     *    - this function will be stored in this._func, and executed using
     *      this.exec()
     *  - a Rational equivalent of the MathML
     *    - this Rational can be obtained using the property MathML.rational,
     *      and is not calculated until called
     *    - due to limitations on the Rational class, only a small subset of
     *      MathML is supported.
     *
     * Usage:
     *     let mathml = new MathML('<apply><times/><pi/><ci>x</ci></apply>');
     *     console.log(mathml.exec(2)); // => 6.283...
     *     let mathml2 = new MathML('<apply><times/><pi/><cn>2</cn></apply>');
     *     console.log(mathml2.rational.approx); // => 6.283...
     *
     * Note specifically:
     *  - x is the only <ci> allowed in the MathML string.
     *  - this._func() is a function of the form func(x) which will apply
     *    the described action. e.g.:
     *        <apply><power/><ci>x</ci><cn>2</cn></apply> will result in:
     *        ((x) => x**2)
     *  - MathML can be arbitrarily complex, but must have exactly one
     *    root-level node.
     * 
     * NOTE: Due to limitations on composing functions recursively, the actual
     *       function returned isn't as simple as suggested above, although it
     *       has the same net effect. Highly complex functions may be costly
     *       to run.
     * 
     * @param  {String}   mathml A MathML <apply> node
     */
    constructor(mathml) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(mathml, 'text/xml');

        this._root = doc.firstChild;
        this._func = this._parseNodeToFunction(this._root);
    }

    /**
     * Get the function performing the action described by the MathML string.
     *
     * Although phrased as a get (and it is one), because it returns a function
     * it can be used to execute the MathML operation. So it can be used e.g.:
     *
     *     let mathml = new MathML('<apply><times/><pi/><ci>x</ci></apply>');
     *     console.log(mathml.exec(2)); // => 6.283...
     * 
     * @return {Function} The function described by the MathML string used to
     *                    constuct this object.
     */
    get exec() {
        return this._func
    }

    /**
     * Get a rational representing the same number as the MathML string.
     *
     * Note that this will only work if the number described is in fact of a
     * form supported by the Rational class.
     * 
     * @return {Rational|RationalTuple}  An equivalent Rational to the number
     *                                   (or RationalTuple to the list)
     *                                   described by the MathML string used to
     *                                   constuct this object.
     */
    get rational() {
        return this._parseNodeToRational(this._root);
    }

    /**
     * Parse any MathML node, returning a function which will perform the
     * described action.
     *
     * @see constructor
     * @param  {Element}   node Any MathML node
     * @return {Function}       A function performing the action described by
     *                          `node`
     */
    _parseNodeToFunction(node) {
        switch(node.tagName) {
            case 'apply':
                return this._parseApplyToFunction(node);
            case 'ci':
                assert(node.textContent === 'x', '<ci> can only take \'x\' in <math-plot>.')

                return (x => x);
            case 'cn':
                assert(/^-?[0-9]+(\.[0-9]+)?$/.test(node.textContent), '<cn> must contain a number.');

                return (x => parseFloat(node.textContent));
            case 'degree':
            case 'logbase':
                return this._parseNodeToFunction(node.firstChild);
            case 'pi':
                return (x => Math.PI);
            case 'exponentiale':
                return (x => Math.E);
            case 'list':
                let elementNodes = Array.from(node.children);
                let elements = elementNodes.map(this._parseNodeToFunction, this);

                return (x => elements.reduce((a, e) => a.concat([e(x)]), []));
            default:
                throw new Error('Unknown MathML element: ' + node.tagName);
        }
    }

    /**
     * Parse an <apply> MathML node, returning a function which will perform
     * the <apply> action.
     *
     * @see parseNodeToFunction
     * @param  {Element}   node A MathML <apply> node
     * @return {Function}       A function performing the action described by
     *                          `node`
     */
    _parseApplyToFunction(node) {
        assert(node.childElementCount >= 2, "<apply> must have at least two children.")

        let action = node.firstChild.tagName;
        let argNodes = Array.from(node.children).slice(1);
        let args = argNodes.map(this._parseNodeToFunction, this);

        switch(action) {
            case 'plus':
                this._assertChildren(node, 3);
                return ((x) => args[0](x) + args[1](x));
            case 'minus':
                assert(node.childElementCount === 2 || node.childElementCount === 3,
                    '<apply><minus/> must have 2 or 3 children.');

                if(node.childElementCount === 3) {
                    return ((x) => args[0](x) - args[1](x));
                } else {
                    return ((x) => -args[0](x));
                }
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
            case 'abs':
                this._assertChildren(node, 2);
                return ((x) => Math.abs(args[0](x)));
            case 'ln':
                this._assertChildren(node, 2);
                return ((x) => Math.log(args[0](x)));
            case 'log':
                let childCount = node.childElementCount;

                assert([2, 3].includes(childCount),
                    `<apply><log/> must have 1 or 2 children.`);

                if(childCount === 2) {
                    return ((x) => Math.log(args[0](x)) / Math.log(10));
                } else {
                    return ((x) => Math.log(args[1](x)) / Math.log(args[0](x)));
                }
            default:
                throw new Error('Unknown <apply> action: ' + action);
        }
    }

    /**
     * Parse any MathML node, returning a Rational which represents the same
     * number
     *
     * @see constructor
     * @param  {Element}   node Any MathML node
     * @return {Rational}       An equivalent Rational
     */
    _parseNodeToRational(node) {
        switch(node.tagName) {
            case 'apply':
                return this._parseApplyToRational(node);
            case 'cn':
                assert(/^-?[0-9]+(\.[0-9]+)?$/.test(node.textContent), '<cn> must contain a number.');

                return new Rational(parseFloat(node.textContent));
            // case 'degree':
            //     return this._parseNodeToRational(node.firstChild);
            case 'pi':
                return new Rational(1, 1, 1);
            case 'exponentiale':
                return new Rational(1, 1, 0, 1);
            case 'list':
                let elementNodes = Array.from(node.children);
                let elements = elementNodes.map(this._parseNodeToRational, this);

                return new RationalTuple(elements);
            default:
                throw new Error('Unknown MathML element: ' + node.tagName);
        }
    }

    /**
     * Parse an <apply> MathML node, returning a Rational which represents the
     * same number
     *
     * @see parseNodeToRational
     * @param  {Element}   node A MathML <apply> node
     * @return {Rational}       An equivalent Rational
     */
    _parseApplyToRational(node) {
        assert(node.childElementCount >= 2, "<apply> must have at least two children.")

        let action = node.firstChild.tagName;
        let argNodes = Array.from(node.children).slice(1);
        let args = argNodes.map(this._parseNodeToRational, this);

        switch(action) {
            case 'plus':
                this._assertChildren(node, 3);

                return args[0].plus(args[1]);
            case 'minus':
                assert(node.childElementCount === 2 || node.childElementCount === 3,
                    '<apply><minus/> must have 2 or 3 children.');

                if(node.childElementCount === 3) {
                    return args[0].minus(args[1]);
                } else {
                    return args[0].times(-1);
                }
            case 'times':
                this._assertChildren(node, 3);

                return args[0].times(args[1]);
            case 'divide':
                this._assertChildren(node, 3);

                return args[0].divide(args[1]);
            case 'power':
                this._assertChildren(node, 3);

                return args[0].power(args[1]);
            default:
                throw new Error('Unknown <apply> action: ' + action);
        }
    }

    /**
     * Given a MathML node, assert that it has exactly `count` children, or
     * else raise an error.
     * 
     * @param  {Element} node  The MathML node whose children are being counted
     * @param  {Number}  count The expected number of children
     */
    _assertChildren(node, count) {
        let action = node.firstChild.tagName;
        assert(node.childElementCount === count,
            `<apply><${action}/> must have ${count-1} children.`);
    }
}

export default MathML;