/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let DisposableEvents;
const Mixin = require('mixto');
const {Disposable} = require('atom');

module.exports =
(DisposableEvents = class DisposableEvents extends Mixin {
  addDisposableEventListener(object, event, listener) {
    object.addEventListener(event, listener);
    return new Disposable(() => object.removeEventListener(event, listener));
  }
});
