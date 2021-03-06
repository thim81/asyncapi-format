'use strict';

const fs = require('fs');
const path = require('path');
const jy = require('js-yaml');

const asyncapiFormat = require('../asyncapi-format.js');

let destroyOutput = false;
const tests = fs.readdirSync(__dirname).filter(file => {
  return fs.statSync(path.join(__dirname, file)).isDirectory() && (!file.startsWith('_'));
});

// SELECTIVE TESTING DEBUG
// const tests = ['yaml-filter-unused-components']
// destroyOutput = true

describe('asyncapi-format tests', () => {
  tests.forEach((test) => {
    describe(test, () => {
      it('should match expected output', async () => {
        let options = {};
        let configFile = null;
        let configFileOptions = {};
        let sortOptions = {sortSet: {}};
        let sortComponentsOptions = {sortComponentsSet: {}};
        let sortFile = null;
        let filterFile = null;
        let casingFile = null;
        let sortComponentsFile = null;
        let filterOptions = {filterSet: {}};
        let casingOptions = {casingSet: {}};
        let inputFilename = null;
        let input = null;

        try {
          // Load options.yaml
          configFile = path.join(__dirname, test, 'options.yaml');
          configFileOptions = jy.load(fs.readFileSync(configFile, 'utf8'));
          configFileOptions.sort = !(configFileOptions['no-sort']);
          options = Object.assign({}, options, configFileOptions);
        } catch (ex) {
          // console.error('ERROR Load options.yaml', ex)
          try {
            // Fallback to options.json
            configFile = path.join(__dirname, test, 'options.json');
            configFileOptions = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            if (configFileOptions['no-sort'] && configFileOptions['no-sort'] === true) {
              configFileOptions.sort = !(configFileOptions['no-sort']);
              delete configFileOptions['no-sort'];
            }
            options = Object.assign({}, options, configFileOptions);
          } catch (ex) {
            // No options found. options = {} will be used
            // console.error('ERROR Load options.json', ex)
          }
        }

        try {
          // Load customSort.yaml
          sortFile = path.join(__dirname, test, 'customSort.yaml');
          sortOptions.sortSet = jy.load(fs.readFileSync(sortFile, 'utf8'));
          options = Object.assign({}, options, sortOptions);
        } catch (ex) {
          // console.error('ERROR Load customSort.yaml', ex)
          try {
            // Fallback to customSort.json
            sortFile = path.join(__dirname, test, 'customSort.json');
            sortOptions.sortSet = JSON.parse(fs.readFileSync(sortFile, 'utf8'));
            options = Object.assign({}, options, sortOptions);
          } catch (ex) {
            // No options found. defaultSort.json will be used
            // console.error('ERROR Load customSort.json', ex)
            options.sortSet = require('../defaultSort.json');
          }
        }

        try {
          // Load customFilter.yaml
          filterFile = path.join(__dirname, test, 'customFilter.yaml');
          filterOptions.filterSet = jy.load(fs.readFileSync(filterFile, 'utf8'));
          options = Object.assign({}, options, filterOptions);
        } catch (ex) {
          // console.error('ERROR Load customFilter.yaml', ex)
          try {
            // Fallback to customFilter.json
            filterFile = path.join(__dirname, test, 'customFilter.json');
            filterOptions.filterSet = jy.load(fs.readFileSync(filterFile, 'utf8'));
            options = Object.assign({}, options, filterOptions);
          } catch (ex) {
            // No options found. defaultSort.json will be used
            // console.error('ERROR Load customSort.json', ex)
            options.filterSet = require('../defaultFilter.json');
          }
        }

        try {
          // Load customCasing.yaml
          casingFile = path.join(__dirname, test, 'customCasing.yaml');
          casingOptions.casingSet = jy.load(fs.readFileSync(casingFile, 'utf8'));
          options = Object.assign({}, options, casingOptions);
        } catch (ex) {
          // console.error('ERROR Load customCasing.yaml', ex)
          try {
            // Fallback to customCasing.json
            casingFile = path.join(__dirname, test, 'customCasing.json');
            casingOptions.casingSet = jy.load(fs.readFileSync(casingFile, 'utf8'));
            options = Object.assign({}, options, casingOptions);
          } catch (ex) {
            // No options found
          }
        }

        try {
          // Load customSortComponents.yaml
          sortComponentsFile = path.join(__dirname, test, 'customSortComponents.yaml');
          sortComponentsOptions.sortComponentsSet = jy.load(fs.readFileSync(sortComponentsFile, 'utf8'));
          options = Object.assign({}, options, sortComponentsOptions);
        } catch (ex) {
          // console.error('ERROR Load customSort.yaml', ex)
          try {
            // Fallback to customSort.json
            sortComponentsFile = path.join(__dirname, test, 'customSortComponents.json');
            sortComponentsOptions.sortComponentsSet = JSON.parse(fs.readFileSync(sortComponentsFile, 'utf8'));
            options = Object.assign({}, options, sortComponentsOptions);
          } catch (ex) {
            // No options found. defaultSort.json will be used
            // console.error('ERROR Load customSort.json', ex)
            options.sortComponentsOptions = require('../defaultSortComponents.json');
          }
        }

        try {
          // Load input.yaml
          inputFilename = path.join(__dirname, test, 'input.yaml');
          input = jy.load(fs.readFileSync(inputFilename, 'utf8'));
        } catch (ex) {
          // console.error('ERROR Load input.yaml', ex)

          // Fallback to customSort.json
          inputFilename = path.join(__dirname, test, 'input.json');
          input = jy.load(fs.readFileSync(inputFilename, 'utf8'));
        }

        // DEBUG
        // console.log('options', options)
        // console.log('inputFilename', inputFilename)

        const outputFilename = path.join(__dirname, test, options.output);
        let readOutput = false;
        let output = {};

        // Destroy existing output, to force update test
        if (destroyOutput) {
          try {
            fs.unlinkSync(outputFilename);
          } catch (e) {
            // console.error('ERROR delete output.yaml', ex)
          }
        }

        try {
          output = jy.load(fs.readFileSync(outputFilename, 'utf8'));
          readOutput = true;
        } catch (ex) {
          // No options found. output = {} will be used
        }

        // Initialize data
        let result = input;

        // Filter AsyncAPI document
        if (options.filterSet) {
          const resFilter = await asyncapiFormat.asyncapiFilter(result, options);
          if (resFilter.data) result = resFilter.data;
        }

        // Sort AsyncAPI document
        if (options.sort === true) {
          const resFormat = await asyncapiFormat.asyncapiSort(result, options);
          if (resFormat.data) result = resFormat.data;
        }

        // Change case AsyncAPI document
        if (options.casingSet) {
          const resFormat = await asyncapiFormat.asyncapiChangeCase(result, options);
          if (resFormat.data) result = resFormat.data;
        }

        // Rename title AsyncAPI document
        if (options.rename) {
          const resRename = await asyncapiFormat.asyncapiRename(result, options);
          if (resRename.data) result = resRename.data;
        }

        try {
          if (!readOutput) {
            if ((options.output && options.output.indexOf('.json') >= 0) || options.json) {
              output = JSON.stringify(result, null, 2);
            } else {
              let lineWidth = (options.lineWidth) ? options.lineWidth : 160
              output = jy.dump(result, {lineWidth: lineWidth});
            }
            fs.writeFileSync(outputFilename, output, 'utf8');
          }
        } catch (error) {
          console.log('error', error);
        }

        // Assert results with output
        expect(result).toStrictEqual(output);
      });
    });
  });
});
