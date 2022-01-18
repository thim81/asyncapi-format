#!/usr/bin/env node
"use strict";

const fs = require('fs');
const traverse = require('traverse');

// Sort Object by Key or list of names
function sortObjectByKeyNameList(object, sortWith) {
  let keys, sortFn;

  if (typeof sortWith === 'function') {
    sortFn = sortWith;
  } else {
    keys = sortWith;
  }

  let objectKeys = Object.keys(object);
  return (keys || []).concat(objectKeys.sort(sortFn)).reduce(function (total, key) {
    if (objectKeys.indexOf(key) !== -1) {
      total[key] = object[key];
    }
    return total;
  }, {});
  // }, Object.create(null));
}

// Compare function - Sort with Priority logic, keep order for non-priority items
function propComparator(priorityArr) {
  return function (a, b) {
    if (a === b) {
      return 0;
    }
    if (!Array.isArray(priorityArr)) {
      return 0;
    }
    const ia = priorityArr.indexOf(a);
    const ib = priorityArr.indexOf(b);
    if (ia !== -1) {
      return ib !== -1 ? ia - ib : -1;
    }
    return ib !== -1 || a > b ? 1 : a < b ? -1 : 0;
  }
}

// Priority sort function
function prioritySort(jsonProp, sortPriority, options) {
  return sortObjectByKeyNameList(jsonProp, propComparator(sortPriority))
}

// AsyncAPI sort function
// Traverse through all keys and based on the key name, sort the props according the preferred order.
function asyncapiSort(oaObj, options) {
  // Skip sorting, when the option "no-sort" is set
  if (options.sort === false) {
    return oaObj;
  }

  let jsonObj = JSON.parse(JSON.stringify(oaObj)); // Deep copy of the schema object
  let sortSet = options.sortSet || JSON.parse(fs.readFileSync(__dirname + "/defaultSort.json", 'utf8'));

  // Recursive traverse through AsyncAPI document
  traverse(jsonObj).forEach(function (node) {
    // if (obj.hasOwnProperty(this.key) && obj[this.key] && typeof obj[this.key] === 'object') {
    if (typeof node === 'object') {
      // Generic sorting
      if (sortSet.hasOwnProperty(this.key) && Array.isArray(sortSet[this.key])) {

        if (Array.isArray(node)) {
          // Deep sort array of properties
          let sortedObj = JSON.parse(JSON.stringify(node)); // Deep copy of the schema object
          for (let i = 0; i < sortedObj.length; i++) {
            sortedObj[i] = prioritySort(sortedObj[i], sortSet[this.key]);
          }
          this.update(sortedObj);

        } else if ((this.key === 'channels' || this.key === 'schemas' || this.key === 'properties')
          && (this.parent && this.parent.key !== 'properties' && this.parent.key !== 'payload')
        ) {
          // Deep sort list of properties
          let sortedObj = JSON.parse(JSON.stringify(node)); // Deep copy of the object
          for (let keyRes in sortedObj) {
            sortedObj[keyRes] = prioritySort(sortedObj[keyRes], sortSet[this.key]);
          }
          this.update(sortedObj);
        } else if (this.parent && this.parent.key !== 'components') {
          // } else {
          // Sort list of properties
          this.update(prioritySort(node, sortSet[this.key]));
        }
      }
    }
  });

  // Process root level
  if (jsonObj.asyncapi) {
    jsonObj = prioritySort(jsonObj, sortSet['root'])
  }
  return jsonObj;
}

// AsyncAPI filter function
// Traverse through all keys and based on the key name, filter the props according to the filter configuration.
function asyncapiFilter(oaObj, options) {
  let jsonObj = JSON.parse(JSON.stringify(oaObj)); // Deep copy of the schema object
  let defaultFilter = JSON.parse(fs.readFileSync(__dirname + "/defaultFilter.json", 'utf8'))
  let filterSet = Object.assign({}, defaultFilter, options.filterSet);
  const operationVerbs = ["subscribe", "publish"];

  // Merge object filters
  const filterKeys = [...filterSet.operations];
  const filterArray = [...filterSet.tags];
  const filterProps = [...filterSet.operationIds, ...filterSet.flags];

  traverse(jsonObj).forEach(function (node) {

    // Filter out object matching the "methods"
    if (filterKeys.length > 0 && filterKeys.includes(this.key)) {
      // Parent has other nodes, so remove only targeted node
      this.remove();
    }

    // Array field matching
    if (Array.isArray(node)) {
      // Filter out object matching the "tags"
      if (filterArray.length > 0 && this.key === 'tags' && filterArray.some(i => node.includes(i))) {
        // Top parent has other nodes, so remove only targeted parent node of matching element
        this.parent.delete();
      }
    }

    // Single field matching
    if (typeof node !== 'object' && !Array.isArray(node)) {
      // Filter out fields matching the flags
      if (filterProps.length > 0 && filterProps.includes(this.key)) {
        // Top parent has other nodes, so remove only targeted parent node of matching element
        this.parent.remove();
      }

      // Filter out fields matching the flagValues/operationIds
      if (filterProps.length > 0 && filterProps.includes(node) && (this.key === 'operationId')) {
        // Top parent has other nodes, so remove only targeted parent node of matching element
        this.parent.remove();
      }
    }

    // Filter out AsyncAPI.tags matching the filter tags
    if (this.parent && this.parent && this.key === 'tags' && this.parent.key === undefined && Array.isArray(node)) {
      // Deep filter array of tags
      let oaTags = JSON.parse(JSON.stringify(node)); // Deep copy of the object
      const oaFilteredTags = oaTags.filter(item => !filterProps.some(i => (Object.keys(item).includes(i))));
      this.update(oaFilteredTags);
    }
  });

  // Clean-up jsonObj
  traverse(jsonObj).forEach(function (node) {
    // Remove empty objects
    if (node && Object.keys(node).length === 0 && node.constructor === Object) {
      this.delete();
    }
    // Remove path items without operations
    // if (this.parent && this.parent.key === 'messages' && !operationVerbs.some(i => this.keys.includes(i))) {
    //     this.delete();
    // }
  });

  return jsonObj;
}

// AsyncAPI rename function
// Change the title of the AsyncAPi document with a provided value.
function asyncapiRename(oaObj, options) {
  let jsonObj = JSON.parse(JSON.stringify(oaObj)); // Deep copy of the schema object

  // AsyncAPI 2
  if (jsonObj.info && jsonObj.info.title && options.rename && options.rename !== "") {
    jsonObj.info.title = options.rename
  }

  return jsonObj;
}

module.exports = {
  asyncapiFilter: asyncapiFilter,
  asyncapiSort: asyncapiSort,
  asyncapiRename: asyncapiRename
};
