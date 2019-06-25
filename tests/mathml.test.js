import {Rational, RationalTuple} from '../rational.js';
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

test('torational-integer', function() {
    expect(mathml('<cn>2</cn>').rational).toStrictEqual(new Rational(2));
});

test('torational-integer-negative', function() {
    expect(mathml('<cn>-2</cn>').rational).toStrictEqual(new Rational(-2));
});

test('torational-float', function() {
    expect(mathml('<cn>0.5</cn>').rational).toStrictEqual(new Rational(1, 2));
});

test('torational-pi', function() {
    expect(mathml('<pi/>').rational).toStrictEqual(new Rational("pi"));
});

test('torational-plus', function() {
    expect(mathml('<apply><plus/><cn>1</cn><cn>2</cn></apply>').rational)
        .toStrictEqual(new Rational(3));
});

test('torational-minus-two-args', function() {
    expect(mathml('<apply><minus/><cn>1</cn><cn>2</cn></apply>').rational)
        .toStrictEqual(new Rational(-1));
});

test('torational-negative-one-arg', function() {
    expect(mathml('<apply><minus/><cn>2</cn></apply>').rational)
        .toStrictEqual(new Rational(-2));
});

test('torational-times', function() {
    expect(mathml('<apply><times/><cn>3</cn><cn>4</cn></apply>').rational)
        .toStrictEqual(new Rational(12));
});

test('torational-divide', function() {
    expect(mathml('<apply><divide/><cn>3</cn><cn>6</cn></apply>').rational)
        .toStrictEqual(new Rational(1, 2));
});

test('torational-approx', function() {
    let rationalApprox = mathml('<apply><times/><cn>2</cn><pi/></apply>')
                    .rational.approx;
    expect(Math.round(rationalApprox * 100) / 100).toEqual(6.28);
});

test('to-rational-tuple', function() {
    expect(mathml('<list><cn>3</cn><pi/></list>').rational)
        .toStrictEqual(new RationalTuple("(3, pi)"));
});
