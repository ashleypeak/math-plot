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
function rational(numerator, denominator, piFactor, eFactor) {
    return new Rational(numerator, denominator, piFactor, eFactor);
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

test('construct-int-int-e', function() {
    expect(rational(1, 2, 0, 1).approx).toEqual(Math.E / 2);
});

test('construct-pi-int', function() {
    expect(rational("pi", 2).approx).toEqual(Math.PI / 2);
});

test('construct-e-int', function() {
    expect(rational("e", 2).approx).toEqual(Math.E / 2);
});

test('construct-str-parse', function() {
    expect(rational("pi/2").approx).toEqual(Math.PI / 2);
});

test('construct-str-parse-e', function() {
    expect(rational("e/2").approx).toEqual(Math.E / 2);
});

test('construct-float', function() {
    expect(rational(0.5).approx).toEqual(0.5);
});

test('add-int-int', function() {
    let a = rational(1);
    let b = rational(2);

    expect(a.plus(b).approx).toEqual(3);
});

test('add-float-float', function() {
    let a = rational("1/2");
    let b = rational("1/4");

    expect(a.plus(b).approx).toEqual(0.75);
});

test('add-int-float', function() {
    let a = rational(1);
    let b = rational("1/4");

    expect(a.plus(b).approx).toEqual(1.25);
});

test('add-pis', function() {
    let a = rational("pi");
    let b = rational("2pi");

    expect(a.plus(b).approx).toEqual(3 * Math.PI);
});

test('add-es', function() {
    let a = rational("e");
    let b = rational("2e");

    expect(a.plus(b).approx).toEqual(3 * Math.E);
});

test('add-pi-int', function() {
    let a = rational("pi");
    let b = rational("2");

    expect(() => { a.plus(b) }).toThrowError(
        new Error('Adding of numbers with different symbol factors not ' +
                  'supported.'));
});

test('add-different-symbols', function() {
    let a = rational("pi");
    let b = rational("e");

    expect(() => { a.plus(b) }).toThrowError(
        new Error('Adding of numbers with different symbol factors not ' +
                  'supported.'));
});

test('subtract-int-int', function() {
    let a = rational(1);
    let b = rational(2);

    expect(a.minus(b).approx).toEqual(-1);
});

test('subtract-float-float', function() {
    let a = rational("1/2");
    let b = rational("1/4");

    expect(a.minus(b).approx).toEqual(0.25);
});

test('subtract-int-float', function() {
    let a = rational(1);
    let b = rational("1/4");

    expect(a.minus(b).approx).toEqual(0.75);
});

test('subtract-pis', function() {
    let a = rational("pi");
    let b = rational("2pi");

    expect(a.minus(b).approx).toEqual(-1 * Math.PI);
});

test('subtract-es', function() {
    let a = rational("e");
    let b = rational("2e");

    expect(a.minus(b).approx).toEqual(-1 * Math.E);
});

test('subtract-pi-int', function() {
    let a = rational("pi");
    let b = rational("2");

    expect(() => { a.minus(b) }).toThrowError(
        new Error('Subtracting of numbers with different symbol factors not ' +
                  'supported.'));
});

test('subtract-different-symbols', function() {
    let a = rational("pi");
    let b = rational("e");

    expect(() => { a.minus(b) }).toThrowError(
        new Error('Subtracting of numbers with different symbol factors not ' +
                  'supported.'));
});

test('multiply-int-int', function() {
    let a = rational(3);
    let b = rational(2);

    expect(a.times(b).approx).toEqual(6);
});

test('multiply-float-float', function() {
    let a = rational("1/2");
    let b = rational("1/4");

    expect(a.times(b).approx).toEqual(0.125);
});

test('multiply-int-float', function() {
    let a = rational(2);
    let b = rational("1/4");

    expect(a.times(b).approx).toEqual(0.5);
});

test('multiply-pis', function() {
    let a = rational("pi");
    let b = rational("2pi");

    expect(a.times(b).approx).toEqual(2 * (Math.PI ** 2));
});

test('multiply-es', function() {
    let a = rational("e");
    let b = rational("2e");

    expect(a.times(b).approx).toEqual(2 * (Math.E ** 2));
});

test('multiply-pi-int', function() {
    let a = rational("pi");
    let b = rational("2");

    expect(a.times(b).approx).toEqual(2 * Math.PI);
});

test('multiply-different-symbols', function() {
    let a = rational("pi");
    let b = rational("e");

    expect(() => { a.times(b) }).toThrowError(
        new Error('Multiplying of numbers with different symbols not ' +
                  'supported.'));

    expect(() => { b.times(a) }).toThrowError(
        new Error('Multiplying of numbers with different symbols not ' +
                  'supported.'));
});

test('divide-int-int', function() {
    let a = rational(3);
    let b = rational(2);

    expect(a.divide(b).approx).toEqual(1.5);
});

test('divide-float-float', function() {
    let a = rational("1/2");
    let b = rational("1/4");

    expect(a.divide(b).approx).toEqual(2);
});

test('divide-int-float', function() {
    let a = rational(2);
    let b = rational("1/4");

    expect(a.divide(b).approx).toEqual(8);
});

test('divide-pis', function() {
    let a = rational("pi");
    let b = rational("2pi");

    expect(a.divide(b).approx).toEqual(0.5);
});

test('divide-es', function() {
    let a = rational("e");
    let b = rational("2e");

    expect(a.divide(b).approx).toEqual(0.5);
});

test('divide-pi-int', function() {
    let a = rational("pi");
    let b = rational("2");

    expect(a.divide(b).approx).toEqual(Math.PI / 2);
});

test('divide-different-symbols', function() {
    let a = rational("pi");
    let b = rational("e");

    expect(() => { a.divide(b) }).toThrowError(
        new Error('Dividing of numbers with different symbols not ' +
                  'supported.'));

    expect(() => { b.divide(a) }).toThrowError(
        new Error('Dividing of numbers with different symbols not ' +
                  'supported.'));
});

test('power-int-int', function() {
    let a = rational(3);
    let b = rational(2);

    expect(a.power(b).approx).toEqual(9);
});

test('power-int-float', function() {
    let a = rational(3);
    let b = rational("1/4");

    expect(() => { a.power(b) }).toThrowError(
        new Error('Raising to a non-integer power is not supported.'));
});

test('power-int-pi', function() {
    let a = rational(3);
    let b = rational("pi");

    expect(() => { a.power(b) }).toThrowError(
        new Error('Raising to a non-integer power is not supported.'));
});

test('power-int-e', function() {
    let a = rational(3);
    let b = rational("e");

    expect(() => { a.power(b) }).toThrowError(
        new Error('Raising to a non-integer power is not supported.'));
});

test('power-pi', function() {
    let a = rational("pi");
    let b = rational(3);

    expect(a.power(b).approx).toEqual(Math.PI ** 3);
});

test('power-e', function() {
    let a = rational("e");
    let b = rational(3);

    expect(a.power(b).approx).toEqual(Math.E ** 3);
});

test('power-raise-to-0', function() {
    let a = rational("e");
    let b = rational(0);

    expect(a.power(b).approx).toEqual(1);
});

test('power-complex-pi', function() {
    let a = rational("2pi").divide(rational("3"));
    let b = rational(3);

    // there are slight rounding errors, so need a more forgiving comparison
    let round_to_10 = (x) => Math.round(1000000000 * x) / 1000000000;

    let result = a.power(b).approx;
    let correct = (8 * (Math.PI ** 3)) / 27;

    expect(round_to_10(result)).toEqual(round_to_10(correct));
});

test('power-complex-e', function() {
    let a = rational("2").divide(rational("3e"));
    let b = rational(3);

    // there are slight rounding errors, so need a more forgiving comparison
    let round_to_10 = (x) => Math.round(1000000000 * x) / 1000000000;

    let result = a.power(b).approx;
    let correct = 8 / (27 * (Math.E ** 3));

    expect(round_to_10(result)).toEqual(round_to_10(correct));
});

test('equal-int-int-true', function() {
    let a = rational(2);
    let b = rational(2);

    expect(a.equal(b)).toBe(true);
});

test('equal-int-int-false', function() {
    let a = rational(2);
    let b = rational(3);

    expect(a.equal(b)).toBe(false);
});

test('equal-pi-true', function() {
    let a = rational("2pi");
    let b = rational(2, 1, 1);

    expect(a.equal(b)).toBe(true);
});

test('equal-pi-false', function() {
    let a = rational("2pi");
    let b = rational("pi");

    expect(a.equal(b)).toBe(false);
});

test('equal-e-pi', function() {
    let a = rational("e");
    let b = rational("pi");

    expect(a.equal(b)).toBe(false);
});

test('equal-e-true', function() {
    let a = rational("2e");
    let b = rational(2, 1, 0, 1);

    expect(a.equal(b)).toBe(true);
});

test('equal-e-false', function() {
    let a = rational("2e");
    let b = rational("e");

    expect(a.equal(b)).toBe(false);
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
