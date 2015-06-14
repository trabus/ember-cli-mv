'use strict';

var fs             = require('fs');
var root           = process.cwd();
var path           = require('path');
var expect         = require('chai').expect;
var MockUI         = require('ember-cli/tests/helpers/mock-ui');
var MockProject    = require('ember-cli/tests/helpers/mock-project');
var Promise        = require('ember-cli/lib/ext/promise');
var UpdatePathsTask = require('../../../lib/tasks/update-paths');

describe('update-paths task', function() {
  var updatePathsTask;
  var ui;
  var project;
  
  beforeEach(function() {
    ui = new MockUI();
    project = new MockProject();
    updatePathsTask = new UpdatePathsTask({
      ui: ui,
      project: project
    });
  });
});