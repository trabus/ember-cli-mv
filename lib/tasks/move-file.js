/*jshint quotmark: false*/

'use strict';

var fs            = require('fs-extra');
var path          = require('path');
var Promise       = require('ember-cli/lib/ext/promise');
var Task          = require('ember-cli/lib/models/task');
var childProcess  = require('child_process');
var SilentError   = require('silent-error');
var ensureDirSync = fs.ensureDirSync;
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
    this.moveInfo = options.moveInfo;
    return this.moveFile(this.sourcepath, this.destpath);
  },
  
  moveFile: function(sourcepath, destpath){
    var ui = this.ui;
    return this.setupForMove(this.moveInfo)
      .then(function() {
        try {
          ui.writeLine('Moving ' + sourcepath + ' to ' + destpath);
          execSync('git mv ' + sourcepath + ' ' + destpath);
        } catch(e) {
          throw new SilentError('git mv error: ' + e.message);
        }
        return true;
      });
  },
  
  setupForMove: function(moveInfo) {
    // if dir doesn't exist
    if (!moveInfo.destExists) {
      // make the directory
      try{
        this.ui.writeLine('Creating destination directory');
        ensureDirSync(moveInfo.destDir);
      } catch(e) {
        throw e;
      }
    }
    
    return Promise.resolve();
  }
});