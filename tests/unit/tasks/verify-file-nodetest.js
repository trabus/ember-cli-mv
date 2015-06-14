'use strict';

var fs             = require('fs');
var root           = process.cwd();
var path           = require('path');
var expect         = require('chai').expect;
var MockUI         = require('ember-cli/tests/helpers/mock-ui');
var MockProject    = require('ember-cli/tests/helpers/mock-project');
var Promise        = require('ember-cli/lib/ext/promise');
var VerifyFileTask = require('../../../lib/tasks/verify-file');

describe('verify-file task', function() {
  var verifyFileTask;
  var ui;
  var project;
  
  beforeEach(function() {
    ui = new MockUI();
    project = new MockProject();
    verifyFileTask = new VerifyFileTask({
      ui: ui,
      project: project
    });
  });
  
  it('checkGitSupport', function(){
    expect(verifyFileTask.checkGitSupport()).to.be.true;
    Promise.resolve().then(function(){
      process.chdir('../');
      expect(verifyFileTask.checkGitSupport()).to.be.false;
      return;
    }).then(function(){
      process.chdir(root);
    });
  });
  
  it('checkSourceGit', function() {
    expect(verifyFileTask.checkSourceGit('./tests/fixtures/smoke-test/foo.js')).to.be.true;
    expect(verifyFileTask.checkSourceGit('./tests/fixtures/smoke-test/bar.js')).to.be.false;
  });
  
  it('checkDestDir', function() {
    expect(verifyFileTask.checkDestDir('./tests/fixtures/smoke-test/bar.js')).to.be.true;
  });
  
  it('checkDestPath', function() {
    expect(verifyFileTask.checkDestPath('./tests/fixtures/smoke-test/bar.js')).to.be.true;
    expect(verifyFileTask.checkDestPath('./tests/fixtures/smoke-test/foo.js')).to.be.false;
  });
  
  it('verifySource', function() {
    expect(verifyFileTask.verifySource('./tests/fixtures/smoke-test/foo.js')).to.be.true;
  });
  
  it('verifyDest', function() {
    expect(verifyFileTask.verifyDest('./tests/fixtures/smoke-test/bar.js')).to.be.true;
  });
});