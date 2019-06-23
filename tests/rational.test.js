import Rational from '../rational.js';


 /**
 * Given some combination of inputs, return a Rational object
 *
 * @see  class Rational from math-plot.js
 * 
 * @param  {Number|String}  numerator   The numerator of the rational
 * @param  {Number|String}  denominator The denominator of the rational
 * @param  {Number}         piFactor    Rational multiplied by pi^piFactor
 * @return {Rational}                   A new Rational object
 */
function rat(numerator, denominator, piFactor) {
    return new Rational(numerator, denominator, piFactor);
}

test('basics', () => {
    expect(rat(1, 2).approx).toEqual(0.5);
    expect(rat("1", "2").approx).toEqual(0.5);
    expect(rat(1, 2, 1).approx).toEqual(Math.PI / 2);
    expect(rat("pi", 2).approx).toEqual(Math.PI / 2);
    expect(rat("pi/2").approx).toEqual(Math.PI / 2);
    expect(rat(0.5).approx).toEqual(0.5);
});
