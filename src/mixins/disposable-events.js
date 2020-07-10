import Mixin from 'mixto';
import {Disposable} from 'atom';

export default class DisposableEvents extends Mixin {
  addDisposableEventListener(object, event, listener) {
    object.addEventListener(event, listener);
    return new Disposable(() => object.removeEventListener(event, listener));
  }
}
