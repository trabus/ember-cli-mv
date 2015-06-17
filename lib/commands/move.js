'use strict';

var fs             = require('fs-extra');
var Promise        = require('ember-cli/lib/ext/promise');
var VerifyFile     = require('../tasks/verify-file');
var MoveFile       = require('../tasks/move-file');
var UpdatePaths    = require('../tasks/update-paths');
var SilentError    = require('silent-error');
var debug          = require('debug')('ember-cli:mv');

module.exports = {
  name: 'move',
  description: 'Moves files in an ember-cli project and updates path references.',
  aliases: ['mv'],
  works: 'insideProject',
  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] }
  ],
  
  run: function(commandOptions, rawArgs){
    var ui = this.ui;
    var taskObject = {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing,
      settings: this.settings
    };
    var taskOptions = {
      ui: this.ui,
      project: this.project,
      args: rawArgs
    };
    var verifyTask     = new VerifyFile(taskObject);
    var moveTask       = new MoveFile(taskObject);
    var updatePathsTask = new UpdatePaths(taskObject);
    debug('Moving file: ', rawArgs[0]);
    return Promise.resolve(this.beforeRun())
      .then(function(){
        return verifyTask.run(taskOptions);
      })
      .then(function(result) {
          taskOptions.moveInfo = result;
          return moveTask.run(taskOptions);
      })
      .then(this.afterMove)
      .then(function() {
        ui.writeLine('Move was successful!');
        return updatePathsTask.run(taskOptions);
      })
      .then(function() {
        ui.writeLine('Updated all paths!');
        return;
      })
      .then(this.afterUpdate)
      .catch(function(e) {
        ui.writeLine('The mv command failed: ' + e.message);
        return;
      });
  },
  
  beforeMove: function() {
  },
  
  afterMove: function() {
  },
  
  afterUpdate: function() {
    
  }
};