'use strict';

var path = require('path');

module.exports = function filterByExt(files, ext) {
  return files.filter(function(file) {
    return path.extname(file) === ext;
  });
};