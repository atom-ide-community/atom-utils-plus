/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

module.exports = {
  requirePackages(...packages) {
    return new Promise(function(resolve, reject) {
      const required = [];
      const failures = [];
      let remains = packages.length;

      const solved = function() {
        remains--;
        if (remains !== 0) { return; }
        if (failures.length > 0) { return reject(failures); }
        return resolve(required);
      };

      return packages.forEach(function(pkg, i) {
        const failHandler = function(reason) {
          failures[i] = reason;
          return solved();
        };

        const promise = atom.packages.activatePackage(pkg)
        .then(function(activatedPackage) {
          required[i] = activatedPackage.mainModule;
          return solved();
        });

        if (promise.fail != null) {
          return promise.fail(failHandler);
        } else if (promise.catch != null) {
          return promise.catch(failHandler);
        }
      });
    });
  },

  registerOrUpdateElement: require('./register-or-update-element'),
  Ancestors: require('./mixins/ancestors'),
  AncestorsMethods: require('./mixins/ancestors'),
  DisposableEvents: require('./mixins/disposable-events'),
  EventsDelegation: require('./mixins/events-delegation'),
  SpacePenDSL: require('./mixins/space-pen-dsl')
};
