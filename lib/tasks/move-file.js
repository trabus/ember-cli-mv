/*jshint quotmark: false*/

'use strict';

var fs            = require('fs-extra');
var path          = require('path');
var chalk         = require('chalk');
var Promise       = require('ember-cli/lib/ext/promise');
var Task          = require('ember-cli/lib/models/task');
var childProcess  = require('child_process');
var SilentError   = require('silent-error');
var ensureDirSync = fs.ensureDirSync;
var execSync;
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
    return this.moveFile(this.sourcepath, this.destpath, options);
  },
  
  moveFile: function(sourcepath, destpath, options){
    var ui = this.ui;
    return this.setupForMove(this.moveInfo)
      .then(function() {
        try {
          ui.writeLine(chalk.green('Moving ') + sourcepath + chalk.green(' to ') + destpath);
          if (!options.dryRun) {
            execSync('git mv ' + sourcepath + ' ' + destpath);
          } else {
            ui.writeLine(chalk.yellow('Moving dry-run, no files were moved.'));
          }
        } catch(e) {
          throw new SilentError(chalk.red('git mv error: ') + e.message);
        }
        return true;
      });
  },
  
  setupForMove: function(moveInfo) {
    // if dir doesn't exist
    if (!moveInfo.destExists && moveInfo.destDir) {
      // make the directory
      try{
        this.ui.writeLine(chalk.green('Creating destination directory: ') + moveInfo.destDir);
        ensureDirSync(moveInfo.destDir);
      } catch(e) {
        throw e;
      }
    }
    
    return Promise.resolve();
  }
});