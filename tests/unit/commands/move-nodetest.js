'use strict';

var expect        = require('chai').expect;
var ember         = require('ember-cli/tests/helpers/ember');
var MockUI        = require('ember-cli/tests/helpers/mock-ui');
var MockAnalytics = require('ember-cli/tests/helpers/mock-analytics');
var Command       = require('ember-cli/lib/models/command');
var Task          = require('ember-cli/lib/models/task');
var Promise       = require('ember-cli/lib/ext/promise');
var RSVP          = require('rsvp');
var fs            = require('fs-extra');
var path          = require('path');
var remove        = Promise.denodeify(fs.remove);
var root          = process.cwd();
var tmp           = require('tmp-sync');
var tmproot       = path.join(root, 'tmp');

var MoveCommandBase = require('../../../lib/commands/move');

describe('move command', function() {
  var ui;
  var tasks;
  var analytics;
  var project;
  var fakeSpawn;
  var CommandUnderTest;
  var buildTaskCalled;
  var buildTaskReceivedProject;

  var tmpdir;

  before(function() {
    CommandUnderTest = Command.extend(MoveCommandBase);
  });

  beforeEach(function() {
    buildTaskCalled = false;
    ui = new MockUI();
    analytics = new MockAnalytics();
    tasks = {
      Build: Task.extend({
        run: function() {
          buildTaskCalled = true;
          buildTaskReceivedProject = !!this.project;

          return RSVP.resolve();
        }
      })
    };

    project = {
      isEmberCLIProject: function(){
        return true;
      }
    };
  });
  /*
  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });
  */
  it('smoke test', function() {
    return new CommandUnderTest({
      ui: ui,
      analytics: analytics,
      project: project,
      environment: { },
      tasks: tasks,
      settings: {},
      runCommand: function(command, args) {
        expect.deepEqual(args, ['./tests/fixtures/smoke-test/foo.js', './tests/fixtures/smoke-test/bar.js']);
      }
    }).validateAndRun(['./tests/fixtures/smoke-test/foo.js', './tests/fixtures/smoke-test/bar.js']);
  });
  
  it('exits for unversioned file', function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
    fs.writeFileSync('foo.js','foo');  
    return new CommandUnderTest({
      ui: ui,
      analytics: analytics,
      project: project,
      environment: { },
      tasks: tasks,
      settings: {},
      runCommand: function(command, args) {
        expect.deepEqual(args, ['nope.js']);
      }
    }).validateAndRun(['nope.js']).then(function() {
      expect(ui.output).to.include('nope.js');
      expect(ui.output).to.include('The source path: nope.js does not exist.');
    }).then(function(){
      process.chdir(root);
      return remove(tmproot);
    });
  });
  
});