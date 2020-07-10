/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {deprecate} = require('grim');

if (global.__CUSTOM_HTML_ELEMENTS_CLASSES__ != null) {
  global.__ATOM_UTILS_CUSTOM_ELEMENT_CLASSES__ = global.__CUSTOM_HTML_ELEMENTS_CLASSES__;
  delete global.__CUSTOM_HTML_ELEMENTS_CLASSES__;
} else {
  if (global.__ATOM_UTILS_CUSTOM_ELEMENT_CLASSES__ == null) { global.__ATOM_UTILS_CUSTOM_ELEMENT_CLASSES__ = {}; }
}

const callbackProperties = [
  'createdCallback',
  'attachedCallback',
  'detachedCallback',
  'attributeChangedCallback'
];

const decorateElementPrototype = function(target, source) {
  callbackProperties.forEach(function(k) {
    return Object.defineProperty(target, k, {
      value() { return this[`__${k}`]?.apply(this, arguments); },
      writable: true,
      enumerable: true,
      configurable: true
    });});

  return Object.getOwnPropertyNames(source).forEach(function(k) {
    if (['constructor'].includes(k)) { return; }

    const descriptor = Object.getOwnPropertyDescriptor(source, k);
    if (callbackProperties.indexOf(k) > -1) {
      return Object.defineProperty(target, `__${k}`, descriptor);
    } else {
      return Object.defineProperty(target, k, descriptor);
    }
  });
};

const decorateElementClass = (target, source) => Object.getOwnPropertyNames(source).forEach(function(k) {
  if (['length', 'name', 'arguments', 'caller', 'prototype'].includes(k)) { return; }

  const descriptor = Object.getOwnPropertyDescriptor(source, k);
  return Object.defineProperty(target, k, descriptor);
});

module.exports = function(nodeName, options) {
  let elementClass, proto;
  const {class: klass} = options;
  if (klass != null) {
    proto = klass.prototype;
  } else {
    proto = options.prototype != null ? options.prototype : options;
  }

  if (proto === options) {
    deprecate('Using the prototype as the second argument is deprecated, use the prototype option instead');
  }


  if (__ATOM_UTILS_CUSTOM_ELEMENT_CLASSES__[nodeName]) {
    elementClass = __ATOM_UTILS_CUSTOM_ELEMENT_CLASSES__[nodeName];

    decorateElementPrototype(elementClass.prototype, proto);
    if (klass != null) { decorateElementClass(elementClass, klass); }

    return elementClass;
  } else {
    const elementPrototype = Object.create(HTMLElement.prototype);
    decorateElementPrototype(elementPrototype, proto);

    elementClass = document.registerElement(nodeName, {prototype: Object.create(elementPrototype)});

    if (klass != null) { decorateElementClass(elementClass, klass); }

    return __ATOM_UTILS_CUSTOM_ELEMENT_CLASSES__[nodeName] = elementClass;
  }
};
