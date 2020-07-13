import Mixin from 'mixto';

const Tags =
  `a abbr address article aside audio b bdi bdo blockquote body button canvas \
caption cite code colgroup datalist dd del details dfn dialog div dl dt em \
fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header html i \
iframe ins kbd label legend li main map mark menu meter nav noscript object \
ol optgroup option output p pre progress q rp rt ruby s samp script section \
select small span strong style sub summary sup table tbody td textarea tfoot \
th thead time title tr u ul var video area base br col command embed hr img \
input keygen link meta param source track wbr`.split(/\s+/);

const SelfClosingTags = {};
`area base br col command embed hr img input keygen link meta param \
source track wbr`.split(/\s+/).forEach(tag => SelfClosingTags[tag] = true);

const Events =
  `blur change click dblclick error focus input keydown \
keypress keyup load mousedown mousemove mouseout mouseover \
mouseup resize scroll select submit unload`.split(/\s+/);

class BabelSpacePenDSL extends Mixin {
  buildContent() {
    if (this.constructor.content != null) { return SpacePenDSL.buildContent(this, this.constructor.content); }
  }
}

export default class SpacePenDSL extends Mixin {
    static initClass() {
      this.Babel = BabelSpacePenDSL;
    }

    static includeInto(klass) {
      super.includeInto(klass);

      Object.defineProperty(klass, 'content', {
        enumerable: false,
        get() { return this.prototype.__content__; },
        set(value) { this.prototype.__content__ = value; }
      });

      Object.defineProperty(klass.prototype, 'createdCallback', {
        enumerable: true,
        get() { return this.__create__; },
        set(value) { this.__createdCallback__ = value; }
      });

      Object.defineProperty(klass.prototype, '__create__', {
        enumerable: true,
        value() {
          if (this.__content__ != null) { SpacePenDSL.buildContent(this, this.__content__); }
          if (this.__createdCallback__ != null) { return (this.__createdCallback__)(); }
        }
      });

      klass.useShadowRoot = () => klass.prototype.__useShadowRoot__ = true;
    }

    static buildContent(element, content) {
      const template = new Template;

      content.call(template);

      const [html] = template.buildHtml();
      let root
      if (element.__useShadowRoot__)
        root = (element.shadowRoot = element.createShadowRoot())
      else
        root = element
      root.innerHTML = html;

      return this.wireOutlets(element, root);
    }

    static wireOutlets(view, root) {
      for (let element of root.querySelectorAll('[outlet]')) {
        const outlet = element.getAttribute('outlet');
        view[outlet] = element;
        element.removeAttribute('outlet');
      }

      return undefined;
    }
}

SpacePenDSL.initClass();

class Template {
  static initClass() {
    Tags.forEach((tagName) => {
      Template.prototype[tagName] = (...args) => {
        return this.currentBuilder.tag(tagName, ...args);
      }
    });
  }
  constructor() { this.currentBuilder = new Builder; }

  subview(name, view) { return this.currentBuilder.subview(name, view); }

  text(string) { return this.currentBuilder.text(string); }

  tag(tagName, ...args) { return this.currentBuilder.tag(tagName, ...args); }

  raw(string) { return this.currentBuilder.raw(string); }

  buildHtml() { return this.currentBuilder.buildHtml(); }
}

Template.initClass();

class Builder {
  constructor() {
    this.document = [];
    this.postProcessingSteps = [];
  }

  buildHtml() {
    return [this.document.join(''), this.postProcessingSteps];
  }

  tag(name, ...args) {
    const options = this.extractOptions(args);

    this.openTag(name, options.attributes);

    if (SelfClosingTags.hasOwnProperty(name)) {
      if ((options.text != null) || (options.content != null)) {
        throw new Error(`Self-closing tag ${name} cannot have text or content`);
      }
    } else {
      options.content?.();
      if (options.text) { this.text(options.text); }
      this.closeTag(name);
    }
  }

  openTag(name, attributes) {
    if (this.document.length === 0) {
      if (attributes == null) { attributes = {}; }
    }

    const attributePairs =
      (() => {
      const result = [];
      for (let attributeName in attributes) {
        const value = attributes[attributeName];
        result.push(`${attributeName}=\"${value}\"`);
      }
      return result;
    })();

    const attributesString =
      attributePairs.length ?
        " " + attributePairs.join(" ")
      :
        "";

    this.document.push(`<${name}${attributesString}>`);
  }

  closeTag(name) {
    this.document.push(`</${name}>`);
  }

  text(string) {
    const escapedString = string
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    this.document.push(escapedString);
  }

  raw(string) {
    this.document.push(string);
  }

  subview(outletName, subview) {
    const subviewId = `subview-${++idCounter}`;
    this.tag('div', {id: subviewId});
    this.postProcessingSteps.push((view) => {
      view[outletName] = subview;
      subview.parentView = view;
      return view.find(`div#${subviewId}`).replaceWith(subview);
    });
  }

  extractOptions(args) {
    const options = {};
    for (let arg of args) {
      switch (typeof(arg)) {
        case 'function':
          options.content = arg;
          break;
        case 'string': case 'number':
          options.text = arg.toString();
          break;
        default:
          options.attributes = arg;
      }
    }
    return options;
  }
}
