/*jshint quotmark: false*/

'use strict';

var fs           = require('fs');
var path         = require('path');
var Promise      = require('ember-cli/lib/ext/promise');
var Task         = require('ember-cli/lib/models/task');
var stringUtils  = require('ember-cli/lib/utilities/string');
var recast       = require('recast');
var childProcess = require('child_process');
var walkSync     = require('walkdir').sync;
// var walkSync     = require('walk-sync');
var SilentError  = require('silent-error');
var compact      = require('lodash/array/compact');
var filterByExt  = require('../utilities/filter-by-ext');
var projectRoot  = process.cwd();
var execSync;
// look at js-git
// if ^0.12 io.js
if (childProcess.execSync) {
  execSync = childProcess.execSync;
} else {
  execSync = require('execSync').exec;
}

module.exports = Task.extend({
  run: function(options) {
    var sourcelist = this.getProjectFileList(projectRoot);
    console.log(sourcelist)
    var trees = sourcelist.js.map(function(filepath) {
        var source = fs.readFileSync(filepath, 'utf-8');
        //  console.log(filepath, source)
        try{
          return {filepath: filepath, source:recast.parse(source)};
        } catch(e) {
           console.log('recast error ', e);
        }
        return;
      }.bind(this))
      .filter(function(source){
        return typeof source !== 'undefined';
      });
    var sourceName = path.basename(options.args[0]).split('.')[0];
    var destName =path.basename(options.args[1]).split('.')[0];
    var visitOptions = {
      projectRoot: projectRoot,
      source: options.args[0],
      dest: options.args[1],
      sourceName: sourceName,
      destName: destName,
      sourceNameVariations: this.getNameVariations(sourceName),
      destNameVariations: this.getNameVariations(destName)
    };
    this.visitProjectTrees(trees,visitOptions)
      .map(function(tree){
        if (tree) {
          console.log(tree)
          var printed = recast.print(tree.ast).code;
          console.log('printing tree', printed)
          console.log('writing file',tree.dest)
          fs.writeFileSync(tree.dest, printed);
          return printed;
        }
        return;
      });
      // console.log(trees)
    return Promise.resolve(true);
  },
  
  /*
  * Return an array of name variations that ember uses
  */
  getNameVariations: function(name) {
    var variations = [];
    variations.push(stringUtils.camelize(name));
    variations.push(stringUtils.classify(name));
    variations.push(stringUtils.dasherize(name));
    variations.push(stringUtils.dasherize(name).split('-').join(' '));
    
    console.log('variations:',variations);
    
    return variations;
  },

  /*
  * Return full list of files in your project
  */
  getProjectFileList: function(root) {
    var files;
    var ignored = ['node_modules/', 'bower_components/', 'dist/', 'tmp/'];
    files = walkSync(root).filter(function(file){
      return !ignored.map(function(i){
        return file.indexOf(i) !== -1;
      }).reduce(function(t,v){
        // if we have a true value, then don't include
        return t ? t : (v ? v : t);
      }); 
    });
    return {
      js: filterByExt(files,'.js'),
      hbs: filterByExt(files,'.hbs')
    };
  },
  
  visitProjectTrees: function(trees, options) {
    console.log('options: ',options)
    return trees.map(function(tree) {
      var hasSourceRef = false;
      recast.visit(tree, {
        visitNode: function(path) {
          var node = path.node;
          
          console.log(node);
            options.sourceNameVariations.forEach(function(variation,index){
              var sourceRegexp = new RegExp(variation);
              var destReplacement = options.destNameVariations[index];
              console.log('variation', variation, index, node.type, node.value);
              // if(node.type === 'MemberExpression' || node.type === 'Identifier') console.log(node)
              if (node.type === 'Literal') {
                if(typeof node.value === 'string' && node.value.indexOf(variation) !== -1) {
                  console.log(node.value.indexOf(variation))
                  console.log('match: ',variation, destReplacement, node)
                  hasSourceRef = true;
                  console.log(node.value.replace(sourceRegexp, destReplacement))
                  node.value = node.value.replace(sourceRegexp, destReplacement);
                }
              }
              if (node.type === 'Identifier') {
                if(node.name.indexOf(variation) !== -1) {
                  hasSourceRef = true;
                  node.name = node.name.replace(sourceRegexp, destReplacement);
                }
              }
            });
          
          // }
          this.traverse(path);
        },
        visitFileExpression: function(path) {
          console.log('visiting ',path);
          this.traverse(path);
        }
      });
      if(hasSourceRef){
        return {ast:tree.source, dest:tree.filepath, options:options};
      }
      return;
    });
  }
  
  
  
});