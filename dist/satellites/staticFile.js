'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Class to manage the static files.
 */
class StaticFile {

  /**
   * Create a new instance of this class.
   *
   * @param api API object reference.
   */


  /**
   * API object reference.
   *
   * @type {null}
   */
  constructor(api) {
    this.api = null;
    this.searchLocations = [];

    let self = this;

    // save API reference object
    self.api = api;
  }

  /**
   * Get the public path.
   *
   * @param connection  Client connection object.
   * @param counter
   * @returns {*}
   */


  /**
   * Search locations.
   *
   * @type {Array}
   */
  searchPath(connection, counter = 0) {
    let self = this;

    if (self.searchLocations.length === 0 || counter >= self.searchLocations.length) {
      return null;
    } else {
      return self.searchLocations[counter];
    }
  }

  /**
   * Get the content of a file by the 'connection.params.file' var.
   *
   * @param connection  Client connection object.
   * @param callback    Callback function.
   * @param counter
   */
  get(connection, callback, counter = 0) {
    let self = this;

    if (!connection.params.file || !self.searchPath(connection, counter)) {
      self.sendFileNotFound(connection, self.api.config.errors.fileNotProvided(connection), callback);
    } else {
      let file = null;

      if (!_path2.default.isAbsolute(connection.params.file)) {
        file = _path2.default.normalize(self.searchPath(connection, counter) + '/' + connection.params.file);
      } else {
        file = connection.params.file;
      }

      if (file.indexOf(_path2.default.normalize(self.searchPath(connection, counter))) !== 0) {
        self.get(connection, callback, counter + 1);
      } else {
        self.checkExistence(file, (exists, truePath) => {
          if (exists) {
            self.sendFile(truePath, connection, callback);
          } else {
            self.get(connection, callback, counter + 1);
          }
        });
      }
    }
  }

  /**
   * Send a file to the client.
   *
   * @param file
   * @param connection
   * @param callback
   */
  sendFile(file, connection, callback) {
    let self = this;
    let lastModified;

    // get file information
    _fs2.default.stat(file, (err, stats) => {
      // check if is an error
      if (err) {
        // if we can't read the file respond with an error
        self.sendFileNotFound(connection, self.api.config.errors.fileReadError(String(err)), callback);
      } else {
        let mime = _mime2.default.lookup(file);
        let length = stats.size;
        let fileStream = _fs2.default.createReadStream(file);
        let start = new Date().getTime();

        lastModified = stats.mtime;

        // add a listener to the 'close' event
        fileStream.on('close', () => {
          let duration = new Date().getTime() - start;
          self.logRequest(file, connection, length, duration, true);
        });

        // add a listener to the 'error' event
        fileStream.on('error', err => {
          self.api.log(err);
        });

        // execute the callback
        callback(connection, null, fileStream, mime, length, lastModified);
      }
    });
  }

  /**
   * Send a file not found error to the client.
   *
   * @param connection    Client connection object.
   * @param errorMessage  Error message to send.
   * @param callback      Callback function.
   */
  sendFileNotFound(connection, errorMessage, callback) {
    let self = this;

    // add error message
    connection.error = new Error(errorMessage);

    // load 404 error
    self.logRequest('{404: not found}', connection, null, null, false);

    // execute the callback function
    callback(connection, self.api.config.errors.fileNotFound(), null, 'text/html', self.api.config.errors.fileNotFound().length);
  }

  /**
   * Check the existence of a file.
   *
   * @param file
   * @param callback
   */
  checkExistence(file, callback) {
    let self = this;

    _fs2.default.stat(file, (error, stats) => {
      // if exists an error execute the callback
      // function and return
      if (error) {
        callback(false, file);
        return;
      }

      if (stats.isDirectory()) {
        let indexPath = file + '/' + self.api.config.general.directoryFileType;
        self.checkExistence(indexPath, callback);
      } else if (stats.isSymbolicLink()) {
        _fs2.default.readlink(file, (error, truePath) => {
          if (error) {
            callback(false, file);
          } else {
            truePath = _path2.default.normalize(truePath);
            self.checkExistence(truePath, callback);
          }
        });
      } else if (stats.isFile()) {
        callback(true, file);
      } else {
        callback(false, file);
      }
    });
  }

  /**
   * Log file requests.
   *
   * @param file
   * @param connection
   * @param length
   * @param duration
   * @param success
   */
  logRequest(file, connection, length, duration, success) {
    let self = this;

    self.api.log(`[ file @ ${connection.type}]`, 'debug', {
      to: connection.remoteIP,
      file: file,
      size: length,
      duration: duration,
      success: success
    });
  }
}

exports.default = class {
  constructor() {
    this.loadPriority = 510;
  }

  /**
   * Satellite load priority.
   *
   * @type {number}
   */


  /**
   * Satellite load function.
   *
   * @param api   API reference object.
   * @param next  Callback function.
   */
  load(api, next) {
    // put static file methods available on the API object
    api.staticFile = new StaticFile(api);

    // load in the explicit public paths first
    if (api.config.general.paths !== undefined) {
      api.staticFile.searchLocations.push(_path2.default.normalize(api.config.general.paths.public));
    }

    // finish satellite loading
    next();
  }
};