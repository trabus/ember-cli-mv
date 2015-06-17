/*jshint quotmark: false*/

'use strict';

var fs           = require('fs');
var path         = require('path');
var Promise      = require('ember-cli/lib/ext/promise');
var Task         = require('ember-cli/lib/models/task');
var sequence     = require('ember-cli/lib/utilities/sequence');
var childProcess = require('child_process');
var SilentError  = require('silent-error');
var exec         = Promise.denodeify(childProcess.exec);
var execSync;
// look at js-git
// if ^0.12 io.js
if (childProcess.execSync) {
  execSync = childProcess.execSync;
} else {
  execSync = require('execSync').exec;
}

module.exports = Task.extend({
  createDestDir: false,
  run: function(options) {
    var _self = this;
    var sourcepath = options.args[0];
    var destpath = options.args[1];
    var verifyResult = {};
    var tasks = [
      this.verifySourcePath.bind(this, sourcepath),
      this.verifyDestPath.bind(this, destpath),
    ];
    return this.checkSourceGit(sourcepath, true)
      .then(function(result) {
        if (!result) {
          tasks.push(_self.promptToAddGit.bind(_self, sourcepath));
        }
        return sequence(tasks);
      })
      .then(function(result) {
        verifyResult = result[1];
        verifyResult.sourceExists = result[0];
        return verifyResult;
      });
      /*
      result: {
        sourceExists:,
        destExists:,
        destDir:,
      }
      
      */
  },
  
  // determine if we need to create the destination directory
  checkDestDir: function(destpath) {
    var exists, stats;
    var dirpath = path.dirname(destpath);
    try{
      stats = fs.lstatSync(dirpath);
      exists = stats.isDirectory();
    } catch(e) {
      this.createDestDir = dirpath;
    }
    return !!exists;
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
  
  checkSourceGit: function(sourcepath, silent) {
    // console.log(sourcepath, fs.existsSync(sourcepath));
    var ui = this.ui;
    /*
    var gitCheck;
    try {
      gitCheck = execSync('git ls-files --error-unmatch ' + sourcepath, { encoding: 'utf8' });
    } catch(e) {
      if (!silent) {
        this.ui.writeLine('The file : ' + sourcepath + ' is not versioned under git.' +
          ' Currently the `ember mv` command requires git.', 'WARNING');
      }
    }
    return !!gitCheck;
    */
    return exec('git ls-files --error-unmatch ' + sourcepath, { encoding: 'utf8' })
      .then(function(result) {
        return !!result;
      })
      .catch(function(e) {
        if (!silent) {
          ui.writeLine('The file : ' + sourcepath + ' is not versioned under git.' +
            ' Currently the `ember mv` command requires git.', 'WARNING');
        }
        return false;
      });
  },
  
  promptToAddGit: function(filepath) {
    var ui = this.ui;
    var promptOptions = {
      type: 'expand',
      name: 'answer',
      default: false,
      message: 'Add ' + filepath + ' to git?',
      choices: [
        { key: 'y', name: 'Yes, add', value: 'add' },
        { key: 'n', name: 'No, skip', value: 'skip' }
      ]
    };

    return ui.prompt(promptOptions)
      .then(function(response) {
        if (response.answer === 'add') {
          return exec('git add ' + filepath);
        }
        ui.writeLine('The file : ' + filepath + ' is not versioned under git.' +
          ' Currently the `ember mv` command requires git.', 'WARNING');
        return false;
      });
  },
  
  // determine if the file already exists and will be overwritten
  verifyDestPath: function(destpath) {
    this.checkDestDir(destpath);
    var exists = fs.existsSync(destpath);
    // we warn if
    if (exists) {
      this.ui.writeLine('The destination path: ' + destpath + ' already exists. Cannot overrwrite.', 'WARNING');
    }

    return {
      destExists: exists,
      destDir: this.createDestDir
    };
  },
  
  verifySourcePath: function(sourcepath) {
    var exists = fs.existsSync(sourcepath);
    if (!exists) {
      throw new SilentError('The source path: ' + sourcepath + ' does not exist.');
    }
    return exists;
  }
  
});