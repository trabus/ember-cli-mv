/*jshint quotmark: false*/

'use strict';

var fs           = require('fs');
var path         = require('path');
var chalk        = require('chalk');
var Promise      = require('ember-cli/lib/ext/promise');
var Task         = require('ember-cli/lib/models/task');
var stringUtils  = require('ember-cli/lib/utilities/string');
var recast       = require('recast');
var childProcess = require('child_process');
var walkSync     = require('walkdir').sync;
var SilentError  = require('silent-error');
var compact      = require('lodash/array/compact');
var filterByExt  = require('../utilities/filter-by-ext');
var projectRoot  = process.cwd();
var debug        = require('debug')('ember-cli:mv');
var detectModuleType      = require('../utilities/detect-module-type');
var detectModuleStructure = require('../utilities/detect-module-structure');
var detectModuleName      = require('../utilities/detect-module-name');
var getTypeName           = require('../utilities/get-type-name');
var execSync;
// if ^0.12 io.js
if (childProcess.execSync) {
  execSync = childProcess.execSync;
} else {
  execSync = require('execSync').exec;
}

module.exports = Task.extend({
  run: function(options) {
    var ui = this.ui;
    var sourcelist  = this.getProjectFileList(projectRoot);
    var podModulePrefix = this.project.config().podModulePrefix || '';
    var podPath         = podModulePrefix.substr(podModulePrefix.lastIndexOf('/') + 1);
    var sourcePath      = options.args[0];
    var sourceType      = detectModuleType(sourcePath);
    var sourceStructure = detectModuleStructure(sourcePath, sourceType);
    var destPath        = options.args[1];
    var destType        = detectModuleType(destPath);
    var destStructure   = detectModuleStructure(destPath, destType);
    
    var sourceName = detectModuleName(sourcePath, 
      { type: sourceType, 
        structure: sourceStructure,
        podModulePrefix: podModulePrefix,
        podPath: podPath
      });
    var destName = detectModuleName(destPath,
      { type: destType, 
        structure: destStructure,
        podModulePrefix: podModulePrefix,
        podPath: podPath
      });
    
    // console.log(sourceType, sourceStructure, sourceName);
    // console.log(destType, destStructure, destName);
    var visitOptions = {
      projectRoot: projectRoot,
      source: options.args[0],
      dest: options.args[1],
      sourceName: sourceName,
      destName: destName,
      sourceNameVariations: this.getNameVariations(sourceName),
      destNameVariations: this.getNameVariations(destName),
      sourceType: sourceType,
      destType: destType,
      sourceTypeName: getTypeName(sourceType, sourceStructure),
      destTypeName: getTypeName(destType, destStructure)
    };
    
    var trees = sourcelist.js
      .map(this.getJSTree)
      .filter(this.filterEmptyTrees);
      
    var templates = sourcelist.hbs
      .map(this.getHBSTree)
      .filter(this.filterEmptyTrees);
    
    this.visitProjectTrees(trees,visitOptions)
      .forEach(function(tree) {
        if (tree) {
          var printed = recast.print(tree.ast).code;
          if (!options.dryRun) {
            fs.writeFileSync(tree.dest, printed);
          }
          ui.writeLine(chalk.green('  updating file ') + tree.dest);
        }
      });
      
    this.visitTemplates(templates, visitOptions)
      .forEach(function(tree) {
        if (tree) {
          if (!options.dryRun) {
            fs.writeFileSync(tree.filePath, tree.source);
          }
          ui.writeLine(chalk.green('  updating file ') + tree.filePath);
        }
      });
    if (options.dryRun) {
      ui.writeLine(chalk.yellow('Updating dry-run, no files were updated.'));
    }
    return Promise.resolve(true);
  },
  
  /*
  * Return an array of name variations that ember uses
  */
  getNameVariations: function(name) {
    var variations = [];
    // var lastSegment = name.split('/').slice(-1)[0] || name;
    var dashedFullPath = name.split('/').join('-');
    variations.push(stringUtils.camelize(name));
    variations.push(stringUtils.dasherize(name));
    variations.push(stringUtils.dasherize(name).split('-').join(' '));
    variations.push(stringUtils.classify(dashedFullPath));
    
    // console.log('variations:',variations);
    
    return variations;
  },

  /*
  * Return full list of files in your project
  */
  getProjectFileList: function(root) {
    var files;
    var ignored = ['node_modules/', 'bower_components/', 'dist/', 'tmp/', 'blueprints/'];
    files = walkSync(root).filter(function(file){
      return !ignored.map(function(i){
        return file.indexOf(i) !== -1;
      }).reduce(function(total,value){
        // if we have a true value, then don't include
        return total ? total : (value ? value : total);
      }); 
    });
    return {
      js: filterByExt(files,'.js'),
      hbs: filterByExt(files,'.hbs')
    };
  },
  
  getJSTree: function(filePath) {
    var source = fs.readFileSync(filePath, 'utf-8');
    debug(filePath, source);
    try{
      return {
        filePath: filePath, 
        source:recast.parse(source)
      };
    } catch(e) {
       throw new SilentError(filePath + ' recast error: ', e);
    }
    return;
  },
  
  getHBSTree: function(filePath) {
    var source = fs.readFileSync(filePath, 'utf-8');
    return {
      filePath: filePath,
      source:source
    };
  },
    
  filterEmptyTrees: function(source) {
    return typeof source !== 'undefined';
  },
  
  visitProjectTrees: function(trees, options) {
    // console.log('options: ',options)
    return trees.map(function(tree) {
      var hasSourceRef = false;
      recast.visit(tree, {
        /*
        visitNode: function(path) {
          var node = path.node;
          
          // console.log(node);
          
          // }
          this.traverse(path);
        },
        */
        visitLiteral: function(path) {
          var node = path.node;
          // console.log('literal node',node);
          if (typeof node.value === 'string') {
            options.sourceNameVariations.forEach(function(variation,index){
              var sourceIndex, typeIndex, segment;
              var sourceRegexp = new RegExp(variation);
              var destReplacement = options.destNameVariations[index];
              var variationIndex = node.value.indexOf(variation);
              if (variationIndex !== -1) {
                console.log(node.value.indexOf(variation))
                // console.log('match: ',variation, destReplacement, node)
                if (variationIndex === 0 || node.value.charAt(variationIndex - 1) === ' ') {
                  hasSourceRef = true;
                  // console.log(node.value.replace(sourceRegexp, destReplacement))
                  node.value = node.value.replace(sourceRegexp, destReplacement);
                } else {
                  
                  /*
                  example1: my-app/components/foo/bar/foo-bar.js
                  example2: my-app/components/bar/foo-bar.js
                  sourceName: bar/foo-bar.js
                  match the sourceName, determine if the sourcename is at 
                  the type root (components for this example)
                  
                  this probably needs to be handled at a structure level.
                  */
                  console.log(variation + ' matched: ' + node.value + ', but was not first index');
                  sourceIndex = node.value.indexOf(options.sourceName);
                  typeIndex = node.value.indexOf(options.sourceTypeName);
                  segment = node.value.substr((typeIndex + options.sourceTypeName.length + 1), node.value.length);
                  console.log('diff', segment, options.sourceName,typeIndex, (typeIndex + options.sourceTypeName.length), sourceIndex, options.sourceTypeName);
                  if (segment === options.sourceName) {
                    hasSourceRef = true;
                    node.value = node.value.replace(sourceRegexp, destReplacement);
                    console.log('rewriting literal', node.value);
                  }
                }
              }
            });
          }
          this.traverse(path);
        },
        visitIdentifier: function(path) {
          var node = path.node;
          // console.log('identifier',node)
          options.sourceNameVariations.forEach(function(variation,index){
            var sourceRegexp = new RegExp(variation);
            var destReplacement = options.destNameVariations[index];
            // console.log('variation', variation, index, node.type, node.value);
            // if(node.type === 'MemberExpression' || node.type === 'Identifier') console.log(node)
            // only replace on exact match
            if(node.name === variation) {
            // console.log(node.name, variation, (node.name === variation))
              hasSourceRef = true;
              node.name = node.name.replace(sourceRegexp, destReplacement);
              console.log('rewriting identifier', node.name);
            }
            
          });
          this.traverse(path);
        }
      });
      if(hasSourceRef){
        return {ast:tree.source, dest:tree.filePath, options:options};
      }
      return;
    });
  },
  
  visitTemplates: function(trees, options) {
    // console.log(trees);
    return trees.map(function(tree){
      var matches = [];
      var moustaches = tree.source.match(/{{\s?([^}]*)\s?}}/g);
      var reg = new RegExp('{{'+options.sourceName+'}}');
      // console.log(options.sourceName,moustaches);
      if (moustaches) {
        matches = moustaches.filter(function(m){
          // console.log('actual',m.match(reg))
          return m.match(reg);
        });
      }
      // console.log('check',String('{{'+options.sourceName+'}}').match(reg));
      if (matches.length > 0) {
        // console.log(matches);
        tree.source = tree.source.replace(reg, '{{'+options.destName+'}}');
        // console.log(tree.source);
        return tree;
      }
      return;
    });
    
  }
  
});