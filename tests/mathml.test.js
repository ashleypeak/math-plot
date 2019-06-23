import Rational from '../rational.js';
import MathML from '../mathml.js';


 /**
 * Given a MathML string, return a MathML object
 *
 * @see  class MathML from math-plot.js
 * 
 * @param  {string}  str The MathML string
 * @return {MathML}      The resultant MathML object
 */
function mathml(str) {
    return new MathML(str);
}

test('basics', () => {
    expect(mathml('<cn>2</cn>').rational).toStrictEqual(new Rational(2));
    expect(mathml('<cn>-2</cn>').rational).toStrictEqual(new Rational(-2));
    expect(mathml('<cn>0.5</cn>').rational).toStrictEqual(new Rational(1, 2));
});
