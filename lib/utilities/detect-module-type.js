'use strict';

var inflector    = require('inflection');
var MODULE_TYPES = [
      'adapter',
      'blueprint',
      'controller',
      'component',
      'helper',
      'http-mock',
      'http-proxy',
      'initializer',
      'instance-initializer',
      'mixin',
      'model',
      'resource',
      'route',
      'serializer',
      'service',
      'template',
      'transform',
      'util',
      'view'
    ];

module.exports = function detectModuleType(filepath) {
  var moduleType;
  MODULE_TYPES.forEach(function testPath(type) {
    if (filepath.indexOf(type) !== -1 || filepath.indexOf(inflector.pluralize(type)) !== -1) {
      moduleType = type;
      return;
    }
  });
  return moduleType;
};