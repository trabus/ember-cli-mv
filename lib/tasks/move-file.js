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
    this.sourcepath = options.args[0];
    this.destpath = options.args[1];
    return this.moveFile();
  },
  
  moveFile: function(){
    var ui = this.ui;
    var sourcepath = this.sourcepath;
    var destpath = this.destpath;
    return Promise.resolve()
      .then(function() {
        try {
          ui.writeLine('Moving ' + sourcepath + ' to ' + destpath);
          execSync('git mv ' + sourcepath + ' ' + destpath);
        } catch(e) {
          throw new SilentError('git mv error: ' + e.message);
        }
        return true;
      });
  }
});