'use strict';

var VerifyFile = require('../tasks/verify-file');

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
    var task = new VerifyFile({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing,
      settings: this.settings
    });
    
    var taskOptions = {
      ui: this.ui,
      project: this.project,
      args: rawArgs
    };
    
    return task.run(taskOptions);
  }
};