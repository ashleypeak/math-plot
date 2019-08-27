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

 /**
 * Given a number, round it to `precision` decimal places
 *
 * @param  {float}    number     The number to be rounded
 * @param  {integer}  precision  The number of decimal places to return
 * @return {float}               The rounded number
 */
function approx(number, precision) {
    let mult = 10 ** precision;

    return Math.round(number * mult) / mult;
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

test('torational-e', function() {
    expect(mathml('<exponentiale/>').rational).toStrictEqual(new Rational("e"));
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

test('torational-power', function() {
    expect(mathml('<apply><power/><cn>3</cn><cn>4</cn></apply>').rational)
        .toStrictEqual(new Rational(81));
});

test('torational-approx', function() {
    let rationalApprox = mathml('<apply><times/><cn>2</cn><pi/></apply>')
                             .rational.approx;
    expect(approx(rationalApprox, 2)).toEqual(6.28);
});

test('torational-tuple', function() {
    expect(mathml('<list><cn>3</cn><pi/></list>').rational)
        .toStrictEqual(new RationalTuple("(3, pi)"));
});

test('tofunction-integer', function() {
    expect(mathml('<cn>2</cn>').exec()).toEqual(2);
});

test('tofunction-integer-negative', function() {
    expect(mathml('<cn>-2</cn>').exec()).toEqual(-2);
});

test('tofunction-float', function() {
    expect(mathml('<cn>0.5</cn>').exec()).toEqual(0.5);
});

test('tofunction-pi', function() {
    expect(approx(mathml('<pi/>').exec(), 2)).toEqual(3.14);
});

test('tofunction-e', function() {
    expect(approx(mathml('<exponentiale/>').exec(), 2)).toEqual(2.72);
});

test('tofunction-plus', function() {
    expect(mathml('<apply><plus/><cn>1</cn><cn>2</cn></apply>').exec())
        .toEqual(3);
});

test('tofunction-minus-two-args', function() {
    expect(mathml('<apply><minus/><cn>1</cn><cn>2</cn></apply>').exec())
        .toEqual(-1);
});

test('tofunction-negative-one-arg', function() {
    expect(mathml('<apply><minus/><cn>2</cn></apply>').exec())
        .toEqual(-2);
});

test('tofunction-times', function() {
    expect(mathml('<apply><times/><cn>3</cn><cn>4</cn></apply>').exec())
        .toEqual(12);
});

test('tofunction-divide', function() {
    expect(mathml('<apply><divide/><cn>3</cn><cn>6</cn></apply>').exec())
        .toEqual(0.5);
});

test('tofunction-power', function() {
    expect(mathml('<apply><power/><cn>3</cn><cn>4</cn></apply>').exec())
        .toEqual(81);
});

test('tofunction-root-square', function() {
    expect(mathml('<apply><root/><cn>2</cn><cn>81</cn></apply>').exec())
        .toEqual(9);
});

test('tofunction-root-cube', function() {
    expect(mathml('<apply><root/><cn>3</cn><cn>27</cn></apply>').exec())
        .toEqual(3);
});

test('tofunction-sin', function() {
    let mml = mathml(
        '<apply><sin/><apply><divide/><pi/><cn>6</cn></apply></apply>');

    // rounding errors make the equality only approximate
    expect(approx(mml.exec(), 5)).toEqual(0.5);
});

test('tofunction-cos', function() {
    let mml = mathml(
        '<apply><cos/><apply><divide/><pi/><cn>3</cn></apply></apply>');

    // rounding errors make the equality only approximate
    expect(approx(mml.exec(), 5)).toEqual(0.5);
});

test('tofunction-tan', function() {
    let mml = mathml(
        '<apply><tan/><apply><divide/><pi/><cn>3</cn></apply></apply>');

    expect(approx(mml.exec(), 5)).toEqual(1.73205);
});

test('tofunction-abs', function() {
    expect(mathml('<apply><abs/><cn>-3</cn></apply>').exec())
        .toEqual(3);
});
