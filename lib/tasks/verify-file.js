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
    return this.checkSourceGit(options.args[0]);
  },
  
  checkGitSupport: function() {
    // verify project is versioned
    var gitCheck;
    try {
      gitCheck = execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' });
      // console.log('git',gitCheck)
    } catch(e) {
      this.ui.writeLine('This project is not versioned under git.' +
       ' Currently the `ember mv` command requires git.', 'WARNING');
    }
    // TODO: verify git version supports mv and ls-files
    return Promise.resolve(!!gitCheck);
  },
  
  checkSourceGit: function(sourcepath) {
    // console.log(sourcepath, fs.existsSync(sourcepath));
    var gitCheck;
    try {
      gitCheck = execSync('git ls-files --error-unmatch '+sourcepath, { encoding: 'utf8' });
    } catch(e) {
      this.ui.writeLine('The file : ' + sourcepath + ' is not versioned under git.' +
        ' Currently the `ember mv` command requires git.', 'WARNING');
    }
    return Promise.resolve(!!gitCheck);
  },
  
  verifySource: function() {
    
  },
  
  checkDestDir: function() {
    
  },
  
  checkDestPath: function() {
    
  }
  
});