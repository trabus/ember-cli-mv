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
var existsSync            = require('exists-sync');
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
          if (options.force) {
            this.ui.writeLine(chalk.yellow('The file: ') + sourcePath + 
              chalk.yellow(' is not under version control.'));
            this.ui.writeLine(chalk.yellow('The force option was used. Adding file ') +
              sourcePath + chalk.yellow(' to git.'));
            tasks.push(this.addToGit.bind(this,sourcePath));
          } else {
            tasks.push(this.promptToAddGit.bind(this, sourcePath));
          }
        } 
        return sequence(tasks);
      }.bind(this))
      .then(function(result) {
        verifyResult = {
          destExists: result[1].destExists,
          destDir: result[1].destDir,
          sourceExists: result[0]
        };
        if (!options.force && verifyResult.destExists) {
          throw new SilentError('The destination: ' + destPath + ' already exists. Cannot execute git mv.');
        }
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
  
  promptToAddGit: function(filePath) {
    var ui = this.ui;
    var promptOptions = {
      type: 'expand',
      name: 'answer',
      default: false,
      message: 'Add ' + filePath + ' to git?',
      choices: [
        { key: 'y', name: 'Yes, add', value: 'add' },
        { key: 'n', name: 'No, skip', value: 'skip' }
      ]
    };

    return ui.prompt(promptOptions)
      .then(function(response) {
        if (response.answer === 'add') {
          return this.addToGit(filePath);
        }
        var warning = 'The file : ' + filePath + ' is not versioned under git.' +
          ' Currently the `ember mv` command requires git.';
        ui.writeLine(chalk.yellow(warning));
        return false;
      }.bind(this));
  },
  
  addToGit: function(filePath) {
    return exec('git add ' + filePath);
  },
  
  // determine if the file already exists and will be overwritten
  verifyDestPath: function(destPath) {
    this.checkDestDir(destPath);
    var exists = existsSync(destPath);
    // we warn if
    // if (exists) {
    //   this.ui.writeLine('The destination path: ' + destPath + ' already exists. Cannot overrwrite.', 'WARNING');
    // }

    return {
      destExists: exists,
      destDir: this.createDestDir
    };
  },
  
  verifySourcePath: function(sourcePath) {
    var exists = existsSync(sourcePath);
    if (!exists) {
      throw new SilentError('The source path: ' + sourcePath + ' does not exist.');
    }
    return exists;
  }
  
});