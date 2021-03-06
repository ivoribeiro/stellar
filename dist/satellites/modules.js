'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This class is responsible to manage all modules, process
 * the NPM dependencies.
 */
class Modules {

  /**
   * Create a new class instance.
   *
   * @param api
   */


  /**
   * Map with the modules paths.
   *
   * @type {Map}
   */


  /**
   * API reference object.
   *
   * @type {null}
   */
  constructor(api) {
    this.api = null;
    this.activeModules = new Map();
    this.modulesPaths = new Map();
    this.moduleActions = new Map();
    this.api = api;
  }

  /**
   * Register a new action name for a module.
   *
   * @param {string} moduleName Module name
   * @param {string|array} value Array of action name to be stored.
   */


  /**
   * This map contains all the actions who are part of each module.
   *
   * @type {Map}
   */


  /**
   * Map with the active modules.
   *
   * Keys are the modules slugs and the values are
   * their manifests.
   *
   * @type {Map}
   */
  regModuleAction(moduleName, value) {
    // first, check there is already a slot to store the actions of this module
    if (!this.moduleActions.has(moduleName)) {
      this.moduleActions.set(moduleName, []);
    }

    // get the array where the action name must be stored
    const arrayOfActions = this.moduleActions.get(moduleName);

    if (Array.isArray(value)) {
      this.moduleActions.set(moduleName, arrayOfActions.concat(value));
    } else if (this.api.utils.isNonEmptyString(value)) {
      arrayOfActions.push(value);
    } else {
      throw new Error('Value got an invalid state');
    }
  }

  /**
   * Load all active modules into memory.
   *
   * The private module is always loaded even if not present on the
   * activeModules property.
   */
  loadModules(next) {
    let self = this;

    // get active modules
    let modules = self.api.config.modules;

    // check if the private module folder exists
    if (this.api.utils.directoryExists(`${self.api.scope.rootPath}/modules/private`)) {
      modules.push('private');
    }

    // this config is required. If doesn't exists or is an empty array
    // an exception should be raised.
    if (modules === undefined || modules.length === 0) {
      next(new Error('At least one module needs to be active.'));

      // engine don't finish the starting wet, soo we need to finish the process
      process.exit(1);
    }

    // load all modules declared in the manifest file
    for (const moduleName of modules) {
      // build the full path
      const path = `${self.api.scope.rootPath}/modules/${moduleName}`;

      // get module manifest file content
      try {
        const manifest = require(`${path}/manifest.json`);

        // save the module config on the engine instance
        self.activeModules.set(manifest.id, manifest);

        // save the module full path
        self.modulesPaths.set(manifest.id, path);
      } catch (e) {
        next(new Error(`There is an invalid module active, named "${moduleName}", fix this to start Stellar normally.`));
        break;
      }
    }
  }

  /**
   * Process all NPM dependencies.
   *
   * The npm install command only is executed if the package.json
   * file are not present.
   *
   * @param next    Callback function.
   */
  processNpmDependencies(next) {
    let self = this;

    // don't use NPM on test environment (otherwise the tests will fail)
    if (self.api.env === 'test') {
      return next();
    }

    // get scope variable
    const scope = this.api.scope;

    // check if the stellar is starting in clean mode. If yes we need remove all
    // temporary files and process every thing again
    if (scope.args.clean) {
      // list of temporary files
      let tempFilesLocations = [`${scope.rootPath}/temp`, `${scope.rootPath}/package.json`, `${scope.rootPath}/node_modules`];

      // iterate all temp paths and remove all of them
      tempFilesLocations.forEach(path => this.api.utils.removePath(path));
    }

    // if the `package.json` file already exists and Stellar isn't starting with
    // the `update` flag return now
    if (this.api.utils.fileExists(`${scope.rootPath}/package.json`) && !scope.args.update) {
      return next();
    }

    // global npm dependencies
    let npmDependencies = {};

    // iterate all active modules
    self.activeModules.forEach(manifest => {
      // check if the module have NPM dependencies
      if (manifest.npmDependencies !== undefined) {
        // merge the two hashes
        npmDependencies = this.api.utils.hashMerge(npmDependencies, manifest.npmDependencies);
      }
    });

    // compile project information
    let projectJson = {
      private: true,
      name: 'stellar-dependencies',
      version: '1.0.0',
      description: 'This is automatically generated don\'t edit',
      dependencies: npmDependencies
    };

    // generate project.json file
    const packageJsonPath = `${self.api.scope.rootPath}/package.json`;
    this.api.utils.removePath(packageJsonPath);
    _fs2.default.writeFileSync(packageJsonPath, JSON.stringify(projectJson, null, 2), 'utf8');

    self.api.log('updating NPM packages', 'info');

    // check the command to be executed
    const npmCommand = scope.args.update ? `npm update` : `npm install`;

    // run npm command
    (0, _child_process.exec)(npmCommand, error => {
      // if an error occurs finish the process
      if (error) {
        self.api.log('An error occurs during the NPM install command', 'emergency');
        process.exit(1);
      }

      // load a success message
      self.api.log('NPM dependencies updated!', 'info');

      // finish the loading process
      next();
    });
  }

}

/**
 * This initializer loads all active modules configs to the
 * engine instance.
 */
exports.default = class {
  constructor() {
    this.loadPriority = 1;
  }

  /**
   * Initializer load priority.
   *
   * @type {number}
   */


  /**
   * Initializer load function.
   *
   * @param api   API reference.
   * @param next  Callback function.
   */
  load(api, next) {
    // instantiate the manager
    api.modules = new Modules(api);

    // load modules into memory
    api.modules.loadModules(next);

    // process NPM dependencies
    api.modules.processNpmDependencies(next);
  }

};