'use strict';

var fs             = require('fs');
var root           = process.cwd();
var path           = require('path');
var expect         = require('chai').expect;
var MockUI         = require('ember-cli/tests/helpers/mock-ui');
var MockProject    = require('ember-cli/tests/helpers/mock-project');
var Promise        = require('ember-cli/lib/ext/promise');
var MoveFileTask   = require('../../../lib/tasks/move-file');

describe('move-file task', function() {
  var moveFileTask;
  var ui;
  var project;
  
  beforeEach(function() {
    ui = new MockUI();
    project = new MockProject();
    moveFileTask = new MoveFileTask({
      ui: ui,
      project: project
    });
  });
  
});