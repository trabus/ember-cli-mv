'use strict';


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
    
  }
};