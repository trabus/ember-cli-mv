'use strict';

var path      = require('path');
var inflector = require('inflection');

module.exports = function detectModuleType(filepath, type) {
  var ext = path.extname(filepath);
  var segments = filepath.split(path.sep);
  // console.log(type + ext)
  
  if (segments.indexOf(inflector.pluralize(type)) >= 0 && segments.indexOf(type + ext) === -1) {
    return 'basic';
  }
  
  if (segments.indexOf(type + ext) >= 0) {
    return 'pod';
  }
};