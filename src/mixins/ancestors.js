/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Ancestors;
const Mixin = require('mixto');

// Public
module.exports =
(Ancestors = class Ancestors extends Mixin {

  /* Public */

  static parents(node, selector='*') {
    const parents = [];
    this.eachParent(node, function(parent) { if (typeof parent.matches === 'function' ? parent.matches(selector) : undefined) { return parents.push(parent); } });
    return parents;
  }

  static eachParent(node, block) {
    let parent = node.parentNode;

    if (parent != null) { block(parent); }
    return (() => {
      const result = [];
      while ((parent = parent.parentNode)) {
        if (parent != null) { result.push(block(parent)); } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  parents(selector='*') { return Ancestors.parents(this, selector); }

  queryParentSelectorAll(selector) {
    if (selector == null) {
      throw new Error('::queryParentSelectorAll requires a valid selector as argument');
    }
    return this.parents(selector);
  }

  queryParentSelector(selector) {
    if (selector == null) {
      throw new Error('::queryParentSelector requires a valid selector as argument');
    }
    return this.queryParentSelectorAll(selector)[0];
  }

  eachParent(block) { return Ancestors.eachParent(this, block); }
});
