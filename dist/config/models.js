'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Configurations for the models.
 *
 * This configuration follows the Waterline pattern, you can see more about
 * this at:
 * https://github.com/balderdashy/waterline-docs/blob/master/introduction/getting-started.md
 *
 * By default we use a memory based adapter to make the startup really simple.
 */
exports.default = {
  models: api => {
    return {
      '_toExpand': false,

      // -----------------------------------------------------------------------
      // Hash with model system adapters
      // -----------------------------------------------------------------------
      adapters: {
        'memory': 'sails-memory'
      },

      // -----------------------------------------------------------------------
      // Hash with the active connections
      // -----------------------------------------------------------------------
      connections: {
        default: {
          adapter: 'memory'
        }
      },

      // -----------------------------------------------------------------------
      // Default connection
      // -----------------------------------------------------------------------
      defaultConnection: 'default',

      // -----------------------------------------------------------------------
      // Use schemas
      //
      // By default Stellar uses a schema based model, this means that only the
      // defined attributes are inserted on the models.
      //
      // You can turn this off when use are using schema-less adapters like the
      // MongoDB or Redis, if you want.
      // -----------------------------------------------------------------------
      schema: true
    };
  }
};