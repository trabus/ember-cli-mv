/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-cli-mv',
  includedCommands: function() {
    return {
      move: require('./lib/commands/move')
    };
  }
};
