/*jshint quotmark: false*/

'use strict';

var fs           = require('fs');
var path         = require('path');
var Promise      = require('ember-cli/lib/ext/promise');
var Task         = require('ember-cli/lib/models/task');
var childProcess = require('child_process');
var SilentError  = require('silent-error');
var execSync;
// look at js-git
// if ^0.12 io.js
if (childProcess.execSync) {
  execSync = childProcess.execSync;
} else {
  execSync = require('execSync').exec;
}

module.exports = Task.extend({
  run: function(options) {
    return Promise.resolve(true);
  }
});