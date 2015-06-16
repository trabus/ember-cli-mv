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
    this.verifySource(this.sourcepath);
    this.verifyDest(this.destpath);
    return Promise.resolve(true);
  },
  
  // determine if we need to create the destination directory
  checkDestDir: function(destpath) {
    var exists, stats;
    var dirpath = path.dirname(destpath);
    try{
      stats = fs.lstatSync(dirpath);
      exists = stats.isDirectory();
    } catch(e) {
      this.createDestDir = true;
    }
    
    return !!exists;
  },
  
  // determine if the file already exists and will be overwritten
  checkDestPath: function(destpath) {
    var exists = fs.existsSync(destpath);
    // we warn if
    if (exists) {
      this.ui.writeLine('The destination path: ' + destpath + ' already exists. Cannot overrwrite.', 'WARNING');
    }
    return !exists;
  },
  
  checkGitSupport: function() {
    // verify project is versioned
    var gitCheck;
    try {
      gitCheck = execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' });
    } catch(e) {
      this.ui.writeLine('This project is not versioned under git.' +
       ' Currently the `ember mv` command requires git.', 'WARNING');
    }
    // TODO: verify git version supports mv and ls-files
    return !!gitCheck;
  },
  
  checkSourceGit: function(sourcepath) {
    // console.log(sourcepath, fs.existsSync(sourcepath));
    var gitCheck;
    try {
      gitCheck = execSync('git ls-files --error-unmatch ' + sourcepath, { encoding: 'utf8' });
    } catch(e) {
      //TODO: prompt for user to add the file to git
      // "Do you want to add the file to git so it can be moved?"
      this.ui.writeLine('The file : ' + sourcepath + ' is not versioned under git.' +
        ' Currently the `ember mv` command requires git.', 'WARNING');
    }
    return !!gitCheck;
  },
  
  checkSourcePath: function(sourcepath) {
    var exists = fs.existsSync(sourcepath);
    if (!exists) {
      this.ui.writeLine('The source path: ' + sourcepath + ' does not exist.', 'WARNING');
    }
    return exists;
  },
  
  verifySource: function(sourcepath) {
    return (this.checkSourcePath(sourcepath) && this.checkSourceGit(sourcepath));
  },
  
  verifyDest: function(destpath) {
    this.checkDestDir(destpath);
    return this.checkDestPath(destpath);
  }
  
});