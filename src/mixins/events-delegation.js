/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let EventsDelegation;
const Mixin = require('mixto');
const DisposableEvents = require('./disposable-events');
const {Disposable, CompositeDisposable} = require('atom');
const eachPair = (object, callback) => (() => {
  const result = [];
  for (let k in object) {
    const v = object[k];
    result.push(callback(k,v));
  }
  return result;
})();

const NO_SELECTOR = '__NONE__';

module.exports =
(EventsDelegation = (function() {
  EventsDelegation = class EventsDelegation extends Mixin {
    static initClass() {
      DisposableEvents.includeInto(this);
    }

    subscribeTo(object, selector, events) {
      if (!(object instanceof HTMLElement)) {
        [object, selector, events] = Array.from([this, object, selector]);
      }

      if (typeof selector === 'object') { [events, selector] = Array.from([selector, NO_SELECTOR]); }

      if (this.eventsMap == null) { this.eventsMap = new WeakMap; }
      if (this.disposablesMap == null) { this.disposablesMap = new WeakMap; }
      if (this.eventsMap.get(object) == null) { this.eventsMap.set(object, {}); }
      if (this.disposablesMap.get(object) == null) { this.disposablesMap.set(object, {}); }

      const eventsForObject = this.eventsMap.get(object);
      const disposablesForObject = this.disposablesMap.get(object);

      eachPair(events, (event, callback) => {
        if (eventsForObject[event] == null) {
          eventsForObject[event] = {};
          disposablesForObject[event] = this.createEventListener(object, event);
        }

        return eventsForObject[event][selector] = callback;
      });

      return new Disposable(() => this.unsubscribeFrom(object, selector, events));
    }

    unsubscribeFrom(object, selector, events) {
      let eventsForObject;
      if (!(object instanceof HTMLElement)) {
        [object, selector, events] = Array.from([this, object, selector]);
      }

      if (typeof selector === 'object') { [events, selector] = Array.from([selector, NO_SELECTOR]); }

      if (!(eventsForObject = this.eventsMap.get(object))) { return; }

      for (let event in events) {
        delete eventsForObject[event][selector];

        if (Object.keys(eventsForObject[event]).length === 0) {
          const disposablesForObject = this.disposablesMap.get(object);
          disposablesForObject[event].dispose();
          delete disposablesForObject[event];
          delete eventsForObject[event];
        }
      }

      if (Object.keys(eventsForObject).length === 0) {
        this.eventsMap.delete(object);
        return this.disposablesMap.delete(object);
      }
    }

    createEventListener(object, event) {
      const listener = e => {
        let eventsForObject;
        if (!(eventsForObject = __guard__(this.eventsMap.get(object), x => x[event]))) { return; }

        const {target} = e;
        this.decorateEvent(e);

        this.eachSelectorFromTarget(e, target, eventsForObject);
        if (!e.isPropagationStopped) { if (typeof eventsForObject[NO_SELECTOR] === 'function') {
          eventsForObject[NO_SELECTOR](e);
        } }
        return true;
      };

      return this.addDisposableEventListener(object, event, listener);
    }

    eachSelectorFromTarget(event, target, eventsForObject) {
      return this.nodeAndItsAncestors(target, node => {
        if (event.isPropagationStopped) { return; }
        return this.eachSelector(eventsForObject, (selector,callback) => {
          const matched = this.targetMatch(node, selector);
          if (event.isImmediatePropagationStopped || !matched) { return; }
          return callback(event);
        });
      });
    }

    eachSelector(eventsForObject, callback) {
      const keys = Object.keys(eventsForObject);
      if (keys.indexOf(NO_SELECTOR) !== - 1) {
        keys.splice(keys.indexOf(NO_SELECTOR), 1);
      }
      keys.sort((a, b) => b.split(' ').length - a.split(' ').length);

      for (let key of keys) {
        if (callback(key, eventsForObject[key])) { return true; }
      }
      return false;
    }

    targetMatch(target, selector) {
      if (target.matches(selector)) { return true; }

      let parent = target.parentNode;
      while ((parent != null) && (parent.matches != null)) {
        if (parent.matches(selector)) { return true; }
        parent = parent.parentNode;
      }

      return false;
    }

    nodeAndItsAncestors(node, callback) {
      let parent = node.parentNode;

      callback(node);
      return (() => {
        const result = [];
        while ((parent != null) && (parent.matches != null)) {
          callback(parent);
          result.push(parent = parent.parentNode);
        }
        return result;
      })();
    }

    decorateEvent(e) {
      const overriddenStop =  Event.prototype.stopPropagation;
      e.stopPropagation = function() {
        this.isPropagationStopped = true;
        return overriddenStop.apply(this, arguments);
      };

      const overriddenStopImmediate =  Event.prototype.stopImmediatePropagation;
      return e.stopImmediatePropagation = function() {
        this.isImmediatePropagationStopped = true;
        return overriddenStopImmediate.apply(this, arguments);
      };
    }
  };
  EventsDelegation.initClass();
  return EventsDelegation;
})());

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}