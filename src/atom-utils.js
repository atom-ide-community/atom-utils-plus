export function requirePackages(...packages) {
    return new Promise((resolve, reject) => {
      const required = [];
      const failures = [];
      let remains = packages.length;

      const solved = () => {
        remains--;
        if (remains !== 0) { return; }
        if (failures.length > 0) { return reject(failures); }
        return resolve(required);
      };

      packages.forEach((pkg, i) => {
        const failHandler = (reason) => {
          failures[i] = reason;
          return solved();
        };

        const promise = atom.packages.activatePackage(pkg)
        .then((activatedPackage) => {
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
}

export registerOrUpdateElement from './register-or-update-element'
export Ancestors from './mixins/ancestors'
export AncestorsMethods from './mixins/ancestors'
export DisposableEvents from './mixins/disposable-events'
export EventsDelegation from './mixins/events-delegation'
export SpacePenDSL from './mixins/space-pen-dsl.coffee'
