import {Rational} from '../rational.js';


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

test('construct-int-int', function() {
    expect(rat(1, 2).approx).toEqual(0.5);
})

test('construct-str-str', function() {
    expect(rat("1", "2").approx).toEqual(0.5);
})

test('construct-int-int-pi', function() {
    expect(rat(1, 2, 1).approx).toEqual(Math.PI / 2);
})

test('construct-pi-int', function() {
    expect(rat("pi", 2).approx).toEqual(Math.PI / 2);
})

test('construct-str-parse', function() {
    expect(rat("pi/2").approx).toEqual(Math.PI / 2);
})

test('construct-float', function() {
    expect(rat(0.5).approx).toEqual(0.5);
});
