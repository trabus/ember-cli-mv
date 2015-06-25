'use strict';

var inflector    = require('inflection');
module.exports = function getTypeName(name, structure) {
  var typeName = name;
  if (structure === 'basic') {
    typeName = inflector.pluralize(name);
  }
  return typeName;
};