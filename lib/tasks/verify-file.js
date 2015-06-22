/*jshint quotmark: false*/

'use strict';

var fs                    = require('fs');
var path                  = require('path');
var chalk                 = require('chalk');
var Promise               = require('ember-cli/lib/ext/promise');
var Task                  = require('ember-cli/lib/models/task');
var sequence              = require('ember-cli/lib/utilities/sequence');
var childProcess          = require('child_process');
var SilentError           = require('silent-error');
var debug                 = require('debug')('ember-cli:mv');
var exec                  = Promise.denodeify(childProcess.exec);
var execSync;
// if ^0.12 io.js
if (childProcess.execSync) {
  execSync = childProcess.execSync;
} else {
  execSync = require('execSync').exec;
}

module.exports = Task.extend({
  createDestDir: false,
  run: function(options) {
    var _self      = this;
    var sourcePath = options.args[0];
    var destPath   = options.args[1];
    var verifyResult = {};
    var tasks = [
      this.verifySourcePath.bind(this, sourcePath),
      this.verifyDestPath.bind(this, destPath),
    ];
    return this.checkSourceGit(sourcePath, true)
      .then(function(result) {
        if (!result) {
          tasks.push(_self.promptToAddGit.bind(_self, sourcePath));
        }
        return sequence(tasks);
      })
      .then(function(result) {
        verifyResult = {
          destExists: result[1].destExists,
          destDir: result[1].destDir,
          sourceExists: result[0]
        };
        return verifyResult;
      });
  },
  
  // determine if we need to create the destination directory
  checkDestDir: function(destPath) {
    var exists, stats;
    var dirpath = path.dirname(destPath);
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
  
  checkSourceGit: function(sourcePath, silent) {
    // console.log(sourcePath, fs.existsSync(sourcePath));
    var ui = this.ui;

    return exec('git ls-files --error-unmatch ' + sourcePath, { encoding: 'utf8' })
      .then(function(result) {
        return !!result;
      })
      .catch(function(e) {
        if (!silent) {
          var warning = 'The file : ' + sourcePath + ' is not versioned under git.' +
            ' Currently the `ember mv` command requires git.';
          ui.writeLine(chalk.yellow(warning));
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
  verifyDestPath: function(destPath) {
    this.checkDestDir(destPath);
    var exists = fs.existsSync(destPath);
    // we warn if
    if (exists) {
      this.ui.writeLine('The destination path: ' + destPath + ' already exists. Cannot overrwrite.', 'WARNING');
    }

    return {
      destExists: exists,
      destDir: this.createDestDir
    };
  },
  
  verifySourcePath: function(sourcePath) {
    var exists = fs.existsSync(sourcePath);
    if (!exists) {
      throw new SilentError('The source path: ' + sourcePath + ' does not exist.');
    }
    return exists;
  }
  
});