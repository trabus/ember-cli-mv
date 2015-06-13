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
    verifyFileTask.checkGitSupport().then(function(result) {
      expect(result).to.be.true;
    });
    Promise.resolve().then(function(){
      process.chdir('../');
      verifyFileTask.checkGitSupport().then(function(result) {
        expect(result).to.be.false;
      }).then(function(){
        process.chdir(root);
      });
    });
  });
  
  it('checkSourceGit', function() {
    verifyFileTask.checkSourceGit('./tests/fixtures/smoke-test/foo.js').then(function(result){
      expect(result).to.be.true;
    });
    verifyFileTask.checkSourceGit('./tests/fixtures/smoke-test/bar.js').then(function(result){
      expect(result).to.be.false;
    });
  });
  
  it('verifySource', function() {
    var result = verifyFileTask.verifySource();
    expect(result).to.be.true;
  });
  
  it('checkDestDir', function() {
    var result = verifyFileTask.checkDestDir();
    expect(result).to.be.true;
  });
  
  it('checkDestPath', function() {
    var result = verifyFileTask.checkDestPath();
    expect(result).to.be.true;
  });
});