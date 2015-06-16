'use strict';

var VerifyFile  = require('../tasks/verify-file');
var MoveFile    = require('../tasks/move-file');
var UpdatePaths = require('../tasks/update-paths');
var debug       = require('debug')('ember-cli:mv');

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
    return verifyTask.run(taskOptions)
      .then(this.beforeRun)
      .then(function() {
        return moveTask.run(taskOptions);
      })
      .then(function() {
        return updatePathsTask.run(taskOptions);
      })
      .then(this.afterMove);
  },
  
  beforeMove: function() {
  },
  
  afterMove: function() {
  }
};