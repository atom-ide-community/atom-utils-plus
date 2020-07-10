import Mixin from 'mixto';

// Public
export default class Ancestors extends Mixin {

  /* Public */

  static parents(node, selector='*') {
    const parents = [];
    this.eachParent(
      node,
      (parent) => { if (parent.matches?.(selector)) { parents.push(parent); } }
    );
    return parents;
  }

  static eachParent(node, block) {
    let parent = node.parentNode;

    if (parent) { block(parent); }
    while ((parent = parent.parentNode)) {
      if (parent) {
        block(parent);
      }
    }
  }

  parents(selector='*') { return Ancestors.parents(this, selector); }

  queryParentSelectorAll(selector) {
    if (!selector) {
      throw new Error('::queryParentSelectorAll requires a valid selector as argument');
    }
    return this.parents(selector);
  }

  queryParentSelector(selector) {
    if (!selector) {
      throw new Error('::queryParentSelector requires a valid selector as argument');
    }
    return this.queryParentSelectorAll(selector)[0];
  }

  eachParent(block) { return Ancestors.eachParent(this, block); }
};
