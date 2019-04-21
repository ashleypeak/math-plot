const TAGNAME = 'math-plot';
const LABELWIDTH = 15;
const LABELHEIGHT = 21;
const FONTSIZE = 17;
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
    <canvas id='canvas' class='canvas'></canvas>
`;


/**
 * The MathPlot is a canvas element which plots graphs of mathematical
 * functions
 */
class MathPlot extends HTMLElement {
    /**
     * Initialises all canvas properties, but doesn't draw anything until
     * connectedCallback()
     * 
     * @constructs
     */
    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
        this.canvas = this.shadowRoot.getElementsByTagName('canvas')[0];
        this.context = this.canvas.getContext('2d');

        //define canvas properties
        this._initDefinedProperties();
        this._initDerivedProperties();

        //intialise canvas
        this.canvas.setAttribute('width', this.width);
        this.canvas.setAttribute('height', this.height);

        //initialise context
        this.context.font = 'italic ' + FONTSIZE + 'px serif';
    }

    /**
     * Collect all properties defined by attributes, or else set them to
     * default values.
     */
    _initDefinedProperties() {
        //initialise graph parameters
        this.width = this.getAttribute('width') || 200;
        this.height = this.getAttribute('height') || 200;
        this.drawXAxis = this.getAttribute('hide-x-axis') !== null ? false : true;
        this.drawYAxis = this.getAttribute('hide-y-axis') !== null ? false : true;

        this.range = {
            x: this._parseRange(this.getAttribute('range-x') || "(-10, 10)"),
            y: this._parseRange(this.getAttribute('range-y') || "(-10, 10)")
        }
        this.range.x.size = this.range.x.max - this.range.x.min;
        this.range.y.size = this.range.y.max - this.range.y.min;

        this.gutter = {
            left: this.getAttribute('gutterLeft') || 20,
            right: this.getAttribute('gutterRight') || 20,
            top: this.getAttribute('gutterTop') || 20,
            bottom: this.getAttribute('gutterBottom') || 20
        }
    }

    /**
     * Given a range of the form "(min, max)", return an object of the form
     * {min: FLOAT, max: FLOAT}
     * 
     * @param  {String} range A string representation of the range
     * @return {Object}       The parsed range
     */
    _parseRange(range) {
        range = range.replace(/\s/g, '');

        let rangePattern = /^\((-?[0-9]+(?:\.[0-9]+)?),(-?[0-9]+(?:\.[0-9]+)?)\)$/;
        let matches = range.match(rangePattern);
        this._assert(matches !== null, "Invalid range provided.");

        let [min, max] = matches.slice(1).map(parseFloat);
        this._assert(min < max, "First term of range must be smaller than second.");

        return {min: min, max: max};
    }

    /**
     * Initialise all object properties which can be derived from provided
     * attributes (or defaults).
     *
     * A note on layout:
     * The canvas in broken up vertically into four sections:
     *  - top label, where the y axis is labelled
     *  - top gutter, which is plotted but outside of rangeY,       
     *    so that the graph doesn't end abruptly at the end of
     *    the range
     *  - the main range of the graph, defined by rangeY
     *  - bottom gutter, like top
     * The canvas is broken up similarly on the x axis.
     * Gutters and range are controllable via attributes, label is present
     * if the axis is drawn, and size is determined by LABELWIDTH / LABELHEIGHT
     */
    _initDerivedProperties() {
        this.main = {
            left: this.gutter.left,
            right: this.width - this.gutter.right - (this.drawXAxis ? LABELWIDTH : 0),
            top: this.gutter.top + (this.drawYAxis ? LABELHEIGHT : 0),
            bottom: this.height - this.gutter.bottom
        }
        this.main.width = this.main.right - this.main.left;
        this.main.height = this.main.bottom - this.main.top;

        //the center positions relative to the graph range
        let relativeCentreX = (0 - this.range.x.min) / this.range.x.size;
        let relativeCentreY = (0 - this.range.y.min) / this.range.y.size;
        //the center of the graph in terms of the canvas
        this.center = {
            x: this.main.left + relativeCentreX * this.main.width,
            y: this.main.top + relativeCentreY * this.main.height
        }
    }

    /**
     * Connected to the DOM. Draw the axes, then all of the curves.
     */
    connectedCallback() {
        this.drawAxes();

        for(let child of this.children) {
            let rule = child.getAttribute('rule');
            let func = this.parseMathML(rule);
        }
    }

    /**
     * Draw the axes of the graph.
     */
    drawAxes() {
        if(this.drawYAxis) {
            this._assert(this.range.x.min <= 0 && this.range.y.max >= 0,
                'Cannot draw the y axis is it is out of range.')

            //has to be fudged to look right
            let labelPosY = FONTSIZE * 4/5;

            let labelWidth = this.context.measureText('y').width;
            let labelPosX = this.center.x - (labelWidth / 2);
            this.context.fillText('y', labelPosX, labelPosY);

            this.context.lineWidth = 2;
            this.context.moveTo(this.center.x, LABELHEIGHT + 12);
            this.context.lineTo(this.center.x, this.height);
            this.context.stroke();

            this.context.lineWidth = 1;
            this.context.moveTo(this.center.x, LABELHEIGHT);
            this.context.lineTo(this.center.x + 5, LABELHEIGHT + 12);
            this.context.lineTo(this.center.x - 5, LABELHEIGHT + 12);
            this.context.fill();
        }

        if(this.drawXAxis) {
            this._assert(this.range.y.min <= 0 && this.range.y.max >= 0,
                'Cannot draw the x axis is it is out of range.')

            //has to be fudged to look right
            let labelPosY = this.center.y + FONTSIZE / 3;

            let labelWidth = this.context.measureText('x').width;
            let labelPosX = this.width - (LABELWIDTH / 2) - (labelWidth / 2);
            this.context.fillText('x', labelPosX, labelPosY);

            this.context.lineWidth = 2;
            this.context.moveTo(0, this.center.y);
            this.context.lineTo(this.width - LABELWIDTH - 12, this.center.y);
            this.context.stroke();

            this.context.lineWidth = 1;
            this.context.moveTo(this.width - LABELWIDTH, this.center.y);
            this.context.lineTo(this.width - LABELWIDTH - 12, this.center.y + 5);
            this.context.lineTo(this.width - LABELWIDTH - 12, this.center.y - 5);
            this.context.fill();
        }
    }

    /**
     * Given a MathML string, return a function which will perform the
     * described action.
     *
     * Specifically:
     *  - x is the only <ci> allowed in the MathML string.
     *  - Returns a function of the form func(x) which will apply descibed
     *    action. e.g.:
     *        <apply><power/><ci>x</ci><cn>2</cn></apply> will return:
     *        ((x) => x**2)
     *  - MathML can be arbitrarily complex, but must have exactly one
     *    root-level node.
     * 
     * NOTE: Due to limitations on composing functions recursively, the actual
     *       function returned isn't as simple as suggested above, although it
     *       has the same net effect. Highly complex functions may be costly
     *       to run.
     * 
     * @param  {String}   node A MathML <apply> node
     * @return {Function}      A function performing the action described by
     *                         `node`
     */
    parseMathML(rule) {
        let parser = new DOMParser();
        let mathml = parser.parseFromString(rule, 'text/xml');
        let root = mathml.firstChild;

        return this._parseMathMLNode(root);
    }

    /**
     * Parse any MathML node, returning a function which will perform the
     * described action.
     *
     * @see parseMathML
     * @param  {String}   node A MathML <apply> node
     * @return {Function}      A function performing the action described by
     *                         `node`
     */
    _parseMathMLNode(node) {
        switch(node.tagName) {
            case 'apply':
                return this._parseMathMLApply(node);
            case 'ci':
                this._assert(node.textContent === 'x', '<ci> can only take \'x\' in <' + TAGNAME + '>.')

                return (x => x);
            case 'cn':
                this._assert(/^-?[0-9]+(\.[0-9]+)?$/.test(node.textContent), '<cn> must contain a number.');

                return (x => parseFloat(node.textContent));
            default:
                throw new Error('Unknown MathML element: ' + node.tagName);
        }
    }

    /**
     * Parse an <apply> MathML node, returning a function which will perform
     * the <apply> action.
     *
     * @see parseMathML
     * @param  {String}   node A MathML <apply> node
     * @return {Function}      A function performing the action described by
     *                         `node`
     */
    _parseMathMLApply(node) {
        this._assert(node.childElementCount >= 2, "<apply> must have at least two children.")

        let action = node.firstChild.tagName;
        let argNodes = Array.from(node.children).slice(1);
        let args = argNodes.map(this._parseMathMLNode, this);

        switch(action) {
            case 'power':
                this._assert(node.childElementCount === 3, "<apply><times/> must have three children.")
                let [base, exp] = args;

                return ((x) => base(x)**exp(x));
            default:
                throw new Error('Unknown <apply> action: ' + action);
        }
    }

    /**
     * Assert that `condition` is true. If it is not, raise an error with
     * message `message`.
     * 
     * @param  {Boolean} condition The condition being asserted
     * @param  {String} message    The error string to be raised if condition
     *                             is false
     */
    _assert(condition, message) {
        if(!condition) {
            throw new Error(message);
        }
    }
}

/**
 * A WebComponent element which is stritly a child of the <math-plot> element.
 * A <math-plot> element many have many <math-plot-function> children (as well
 *     as many <math-plot-*> children.)
 * Defines a curve which is to be plotted on the MathPlot canvas.
 * Performs no actions itself, just used as a way of easily writing in HTML
 *     the curves to be plotted.
 */
class MathPlotFunction extends HTMLElement {
    /**
     * @constructs
     */
    constructor() {
        super();
    }
}


customElements.define(TAGNAME, MathPlot);
customElements.define(TAGNAME + '-function', MathPlotFunction);