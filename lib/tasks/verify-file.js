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
    // console.log('result',this.checkSourceGit('./lib/tasks/verify-file.js'));
    // console.log('result',this.checkSourceGit('./lib/tasks/ver.js'));
    return Promise.resolve(this.checkSourceGit(options.args[0]));
  },
  
  checkSourceGit: function(sourcepath) {
    console.log(sourcepath, fs.existsSync(sourcepath));
    var gitCheck;
    try {
      gitCheck = execSync('git ls-files --error-unmatch '+sourcepath);
    } catch(e) {
      // console.log(this.ui)
      this.ui.writeLine('The file : ' + sourcepath + ' is not versioned under git.' +
        ' Currently the `ember mv` command requires git.', 'WARNING');
      return false;
    }
    return true;
  },
  
  verifySource: function() {
    
  },
  
  checkDestDir: function() {
    
  }
  
});