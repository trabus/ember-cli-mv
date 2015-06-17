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
var exec          = Promise.denodeify(require('child_process').exec);
var remove        = Promise.denodeify(fs.remove);
var ensureFile    = Promise.denodeify(fs.ensureFile);
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
      isEmberCLIProject: function() {
        return true;
      }
    };
  });
  
  function setupGit() {
    return exec('git --version')
      .then(function(){
        return exec('git rev-parse --is-inside-work-tree', { encoding: 'utf8' })
          .then(function(result) {
            console.log('result',result)
            return;
            // return exec('git init');
          })
          .catch(function(e){
            return exec('git init');
          });
      });
  }
  
  function generateFile(path) {
    return ensureFile(path);
  }
  
  function addFileToGit(path) {
    return ensureFile(path)
      .then(function() {
        return exec('git add .');
      });
  }
  
  function addFilesToGit(files) {
    var filesToAdd = files.map(addFileToGit);
    return RSVP.all(filesToAdd);
  }
  
  function setupForMove() {
    return setupTmpDir()
      // .then(setupGit)
      .then(addFilesToGit.bind(null,['foo.js','bar.js']));
  }
  
  function setupTmpDir() {
    return Promise.resolve()
      .then(function(){
        tmpdir = tmp.in(tmproot);
        process.chdir(tmpdir);
        return tmpdir;
      });
  }
  
  function cleanupTmpDir() {
    return Promise.resolve()
      .then(function(){
        process.chdir(root);
        return remove(tmproot);
      });
  }
  
  /*
  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });
  */
  /*
  //TODO: fix so this isn't moving the fixtures
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
  */
  
  it('exits for unversioned file', function() {
    return setupTmpDir()
      .then(function(){
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
        });
      })
      .then(cleanupTmpDir);
  });
  
  it('can move a file', function() {
    return setupForMove().
      then(function(result) {
        console.log('result',result);
        return new CommandUnderTest({
          ui: ui,
          analytics: analytics,
          project: project,
          environment: { },
          tasks: tasks,
          settings: {},
          runCommand: function(command, args) {
            expect.deepEqual(args, ['foo.js', 'foo-bar.js']);
          }
        }).validateAndRun(['foo.js', 'foo-bar.js']).then(function() {
          expect(ui.output).to.include('foo.js');
          // expect(ui.output).to.include('The source path: nope.js does not exist.');
        });
      })
      .then(cleanupTmpDir);
  });
  
});