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
    return verifyFileTask.checkSourceGit(path.join(root,'/tests/fixtures/smoke-test/foo.js'))
      .then(function(result){
        expect(result).to.be.true;
        return;
      })
      .then(function(){
        return verifyFileTask.checkSourceGit(paht.join(root,'/tests/fixtures/smoke-test/bar.js'))
        .then(function(result){
          expect(result).to.be.false;
          return;
        });
      });
  });
  
  it('checkDestDir', function() {
    expect(verifyFileTask.checkDestDir('./tests/fixtures/smoke-test/bar.js')).to.be.true;
  });
  
  it('verifyDestPath', function() {
    expect(verifyFileTask.verifyDestPath('./tests/fixtures/smoke-test/bar.js')).to.be.true;
    expect(verifyFileTask.verifyDestPath('./tests/fixtures/smoke-test/foo.js')).to.be.false;
  });
  
  it('verifySourcePath', function() {
    expect(verifyFileTask.verifySourcePath('./tests/fixtures/smoke-test/foo.js')).to.be.true;
  });
});