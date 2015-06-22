'use strict';

var path      = require('path');
var inflector = require('inflection');

module.exports = function detectModuleName(filePath, options) {
  /* options
  type,
  structure,
  podModulePrefix,
  podPath
  */
  var start = 0;
  var end   = 0;
  var segments = filePath.split(path.sep);
  var ext      = path.extname(filePath);
  if (options.structure === 'pod') {
    if (options.podModulePrefix && options.podPath) {
      start = segments.indexOf(options.podPath) + 1;
    } else {
      if (options.type === 'component') {
        start = segments.indexOf('components') + 1;
      } else {
        start = segments.indexOf('app') + 1;
      }
    }
    
    end = segments.indexOf(options.type + ext);
  }
  
  if (options.structure === 'basic') {
    start = segments.indexOf(inflector.pluralize(options.type)) + 1;
    end = segments.length;
  }
  // console.log('name:',segments, start, end, segments.slice(start,end).join('/'))
  
  return segments.slice(start,end).join('/').split('.')[0];
};