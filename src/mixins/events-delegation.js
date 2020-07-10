import Mixin from 'mixto';
import DisposableEvents from './disposable-events';
import {Disposable, CompositeDisposable} from 'atom';
const eachPair = (object, callback) => {
  for (let k in object) {
    const v = object[k];
    callback(k,v);
  }
}

const NO_SELECTOR = '__NONE__';

export default class EventsDelegation extends Mixin {
    static initClass() {
      DisposableEvents.includeInto(this);
    }

    subscribeTo(object, selector, events) {
      if (!(object instanceof HTMLElement)) {
        [object, selector, events] = [this, object, selector];
      }

      if (typeof selector === 'object') { [events, selector] = [selector, NO_SELECTOR]; }

      if (!this.eventsMap) { this.eventsMap = new WeakMap; }
      if (!this.disposablesMap) { this.disposablesMap = new WeakMap; }
      if (!this.eventsMap.get(object)) { this.eventsMap.set(object, {}); }
      if (!this.disposablesMap.get(object)) { this.disposablesMap.set(object, {}); }

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
        [object, selector, events] = [this, object, selector];
      }

      if (typeof selector === 'object') { [events, selector] = [selector, NO_SELECTOR]; }

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
        if (!(eventsForObject = this.eventsMap.get(object)?.[event])) { return; }

        const {target} = e;
        this.decorateEvent(e);

        this.eachSelectorFromTarget(e, target, eventsForObject);
        if (!e.isPropagationStopped) {
          eventsForObject[NO_SELECTOR]?.(e);
        }
        return true;
      };

      return this.addDisposableEventListener(object, event, listener);
    }

    eachSelectorFromTarget(event, target, eventsForObject) {
      this.nodeAndItsAncestors(target, node => {
        if (event.isPropagationStopped) { return; }
        this.eachSelector(eventsForObject, (selector,callback) => {
          const matched = this.targetMatch(node, selector);
          if (event.isImmediatePropagationStopped || !matched) { return; }
          callback(event);
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
      while ((parent != null) && (parent.matches != null)) {
        callback(parent);
        parent = parent.parentNode;
      }
    }

    decorateEvent(e) {
      const overriddenStop =  Event.prototype.stopPropagation;
      e.stopPropagation = () => {
        this.isPropagationStopped = true;
        overriddenStop.apply(this, arguments);
      };

      const overriddenStopImmediate =  Event.prototype.stopImmediatePropagation;
      e.stopImmediatePropagation = () => {
        this.isImmediatePropagationStopped = true;
        overriddenStopImmediate.apply(this, arguments);
      };
    }
}

EventsDelegation.initClass();