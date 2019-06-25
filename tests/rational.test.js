import {Rational, RationalTuple} from '../rational.js';


 /**
 * Given some combination of inputs, return a Rational object
 *
 * @see  class Rational from rational.js
 * 
 * @param  {Number|String}  numerator   The numerator of the rational
 * @param  {Number|String}  denominator The denominator of the rational
 * @param  {Number}         piFactor    Rational multiplied by pi^piFactor
 * @return {Rational}                   A new Rational object
 */
function rational(numerator, denominator, piFactor) {
    return new Rational(numerator, denominator, piFactor);
}

 /**
 * Given an argument `tuple`, return a RationalTuple object
 *
 * @see  class RationalTuple from rational.js
 * 
 * @param  {String|Array}   tuple  A description of the tuple
 * @return {RationalTuple}         A new RationalTuple object
 */
function tuple(tuple) {
    return new RationalTuple(tuple);
}

test('construct-int-int', function() {
    expect(rational(1, 2).approx).toEqual(0.5);
});

test('construct-str-str', function() {
    expect(rational("1", "2").approx).toEqual(0.5);
});

test('construct-int-int-pi', function() {
    expect(rational(1, 2, 1).approx).toEqual(Math.PI / 2);
});

test('construct-pi-int', function() {
    expect(rational("pi", 2).approx).toEqual(Math.PI / 2);
});

test('construct-str-parse', function() {
    expect(rational("pi/2").approx).toEqual(Math.PI / 2);
});

test('construct-float', function() {
    expect(rational(0.5).approx).toEqual(0.5);
});

test('construct-tuple-from-string', function() {
    expect(tuple("(1, pi)")._tuple)
        .toStrictEqual([rational(1), rational("pi")]);
});

test('construct-tuple-from-rationals', function() {
    expect(tuple([rational(1), rational("pi")])._tuple)
        .toStrictEqual([rational(1), rational("pi")]);
});

test('tuple-from-string-approx', function() {
    expect(tuple("(1, 3/2)").approx).toStrictEqual([1, 1.5]);
});

test('tuple-from-rationals-approx', function() {
    expect(tuple([rational(1), rational("3/2")]).approx)
        .toStrictEqual([1, 1.5]);
});
