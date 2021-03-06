'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This class is a wrapper for bcrypt library.
 *
 * This allow users hash data and compare plain data with
 * and hash to validate them.
 */
class Hash {

  /**
   * Create a new class instance.
   *
   * @param api   API object reference.
   */
  constructor(api) {
    this.api = null;
    this.api = api;
  }

  // -------------------------------------------------------------------------- [Public]

  /**
   * Generate new bcrypt salt
   *
   * @param rounds        Number of rounds
   * @returns {Promise}
   */


  /**
   * API reference object.
   *
   * @type {null}
   */
  generateSalt(rounds = this.api.config.general.saltRounds) {
    return new Promise((resolve, reject) => {
      _bcrypt2.default.genSalt(rounds, (error, salt) => error ? reject(error) : resolve(salt));
    });
  }

  /**
   * Generate a new bcrypt salt in sync mode
   *
   * @param rounds  Number of rounds
   */
  generateSaltSync(rounds = this.api.config.general.saltRounds) {
    return _bcrypt2.default.genSaltSync(rounds);
  }

  /**
   * Hash data
   *
   * @param data          Data to hash
   * @param _config       Additional configuration where you can override
   *                      pre-defined config
   * @return {Promise}
   */
  hash(data, _config = {}) {
    let self = this;

    // build the configs object
    let config = self._getConfigs(_config);

    // create a new promise and generate the hash
    return new Promise((resolve, reject) => {
      _bcrypt2.default.hash(data, config.salt || config.saltLength, (error, hash) => error ? reject(error) : resolve(hash));
    });
  }

  /**
   * Hash data in sync mode
   *
   * @param data        Data to hash
   * @param _config     Additional configuration where you can override pre-defined config
   * @returns {String}  Returns hashed data
   */
  hashSync(data, _config = {}) {
    let self = this;

    // build the configs object
    let config = self._getConfigs(_config);

    // hash the data with the bcrypt
    return _bcrypt2.default.hashSync(data, config.salt || config.saltLength);
  }

  /**
   * Compare hash with plain data
   *
   * @param plainData     Plain data
   * @param hash          Hash to compare with
   * @returns {Promise}
   */
  compare(plainData, hash) {
    return new Promise((resolve, reject) => {
      _bcrypt2.default.compare(plainData, hash, (error, equal) => error ? reject(error) : resolve(equal));
    });
  }

  /**
   * Compare data with hash in sync mode
   *
   * @param plainData     Plain data
   * @param hash          Hash to compare with
   * @returns {Boolean}   Returns true if equal
   */
  compareSync(plainData, hash) {
    return _bcrypt2.default.compareSync(plainData, hash);
  }

  // -------------------------------------------------------------------------- [Private]

  /**
   * Get configs to be used on the generation.
   *
   * @param _configs  User defined configs
   * @returns {{}}
   * @private
   */
  _getConfigs(_configs = {}) {
    let self = this;

    return this.api.utils.hashMerge({
      salt: self.api.config.general.salt,
      saltRounds: self.api.config.general.saltRounds,
      saltLength: self.api.config.general.saltLength
    }, _configs);
  }

}

exports.default = class {
  constructor() {
    this.loadPriority = 400;
  }

  /**
   * Satellite load priority.
   *
   * @type {number}
   */


  /**
   * Satellite loading function.l
   *
   * @param api     API reference object
   * @param next    Callback function
   */
  load(api, next) {
    // put the hash functions available to everyone
    api.hash = new Hash(api);

    // finish the satellite loading
    next();
  }

};