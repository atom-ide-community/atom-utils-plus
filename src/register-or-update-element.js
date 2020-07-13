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

function decorateElementPrototype(target, source) {
  callbackProperties.forEach((k) => {
    Object.defineProperty(target, k, {
      value() { return this[`__${k}`]?.apply(this, arguments); },
      writable: true,
      enumerable: true,
      configurable: true
    });
  });

  Object.getOwnPropertyNames(source).forEach((k) => {
    if (['constructor'].includes(k)) { return; }

    const descriptor = Object.getOwnPropertyDescriptor(source, k);
    if (callbackProperties.indexOf(k) > -1) {
      Object.defineProperty(target, `__${k}`, descriptor);
    } else {
      Object.defineProperty(target, k, descriptor);
    }
  });
}

function decorateElementClass(target, source) {
  Object.getOwnPropertyNames(source).forEach((k) => {
    if (['length', 'name', 'arguments', 'caller', 'prototype'].includes(k)) { return; }

    const descriptor = Object.getOwnPropertyDescriptor(source, k);
    Object.defineProperty(target, k, descriptor);
  });
}

let grim_deprecate; // dynamic imported

export default function registerOrUpdateElements(nodeName, options) {
  const {class: klass} = options;
  let proto;
  if (klass != null) {
    proto = klass.prototype;
  } else {
    proto = options.prototype != null ? options.prototype : options;
  }

  if (proto === options) {
    const deprecationMessage = 'Using the prototype as the second argument is deprecated, use the prototype option instead'

    if (!grim_deprecate) {
      // dynamic imported for the first time
      import('grim').then(({deprecate}) => {
        grim_deprecate = deprecate;
        grim_deprecate(deprecationMessage);
      })
    } else {
      grim_deprecate(deprecationMessage);
    }

  }

  let elementClass;
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
