#!/usr/bin/env node
"use strict";

const fs = require('fs');
const traverse = require('traverse');
const {isString, isObject, isArray} = require("./util-types");
const {
  adaCase,
  camelCase,
  capitalCase,
  cobolCase,
  constantCase,
  dotNotation,
  kebabCase,
  lowerCase,
  pascalCase,
  snakeCase,
  spaceCase,
  trainCase,
  upperCase
} = require("case-anything");

/**
 * Sort Object by Key or list of names
 * @param object
 * @param sortWith
 * @returns {*}
 */
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

/**
 * Compare function - Sort with Priority logic, keep order for non-priority items
 * @param priorityArr
 * @returns {(function(*=, *=): (number|number))|*}
 */
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

/**
 * Priority sort function
 * @param jsonProp
 * @param sortPriority
 * @param options
 * @returns {*}
 */
function prioritySort(jsonProp, sortPriority, options) {
  return sortObjectByKeyNameList(jsonProp, propComparator(sortPriority))
}

/**
 * AsyncAPI sort function
 * Traverse through all keys and based on the key name, sort the props according the preferred order.
 * @param {object} oaObj AsyncAPI document
 * @param {object} options AsyncAPI-format sort options
 * @returns {object} Sorted AsyncAPI document
 */
function asyncapiSort(oaObj, options) {
  // Skip sorting, when the option "no-sort" is set
  if (options.sort === false) {
    return oaObj;
  }

  let jsonObj = JSON.parse(JSON.stringify(oaObj)); // Deep copy of the schema object
  let sortSet = options.sortSet || JSON.parse(fs.readFileSync(__dirname + "/defaultSort.json", 'utf8'));

  let debugStep = '' // uncomment // debugStep below to see which sort part is triggered

  // Recursive traverse through AsyncAPI document
  traverse(jsonObj).forEach(function (node) {
    // if (obj.hasOwnProperty(this.key) && obj[this.key] && typeof obj[this.key] === 'object') {
    if (typeof node === 'object') {
      // Generic sorting
      if (sortSet.hasOwnProperty(this.key) && Array.isArray(sortSet[this.key])) {

        if (Array.isArray(node)) {
          // debugStep = 'Generic sorting - array'
          // Deep sort array of properties
          let sortedObj = JSON.parse(JSON.stringify(node)); // Deep copy of the schema object
          for (let i = 0; i < sortedObj.length; i++) {
            sortedObj[i] = prioritySort(sortedObj[i], sortSet[this.key]);
          }
          this.update(sortedObj);

        } else if ((this.key === 'channels' || this.key === 'schemas' || this.key === 'properties')
          && (this.parent && this.parent.key !== 'properties' && this.parent.key !== 'payload')
        ) {
          // debugStep = 'Generic sorting - responses/schemas/properties'
          // Deep sort list of properties
          let sortedObj = JSON.parse(JSON.stringify(node)); // Deep copy of the object
          for (let keyRes in sortedObj) {
            sortedObj[keyRes] = prioritySort(sortedObj[keyRes], sortSet[this.key]);
          }
          this.update(sortedObj);
        } else if (this.parent && this.parent.key !== 'components') {
          // } else {
          // debugStep = 'Generic sorting - properties'
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

  // Return result object
  return {data: jsonObj, resultData: {}}
}

/**
 * AsyncAPI filter function
 * Traverse through all keys and based on the key name, filter the props according to the filter configuration.
 * @param {object} oaObj AsyncAPI document
 * @param {object} options AsyncAPI-format filter options
 * @returns {object} Filtered AsyncAPI document
 */
function asyncapiFilter(oaObj, options) {
  let jsonObj = JSON.parse(JSON.stringify(oaObj)); // Deep copy of the schema object
  let defaultFilter = JSON.parse(fs.readFileSync(__dirname + "/defaultFilter.json", 'utf8'))
  let filterSet = Object.assign({}, defaultFilter, options.filterSet);
  const operationVerbs = ["subscribe", "publish"];

  // Merge object filters
  const filterKeys = [...filterSet.operations];
  const filterArray = [...filterSet.tags];
  const filterProps = [...filterSet.operationIds, ...filterSet.flags];

  // Prepare unused components
  let unusedComp = {
    schemas: [],
    responses: [],
    parameters: [],
    examples: [],
    requestBodies: [],
    headers: [],
    meta: {total: 0}
  }

  let debugFilterStep = '' // uncomment // debugFilterStep below to see which sort part is triggered

  traverse(jsonObj).forEach(function (node) {

    // Filter out object matching the "methods"
    if (filterKeys.length > 0 && filterKeys.includes(this.key)) {
      // debugFilterStep = 'Filter - methods'
      // Parent has other nodes, so remove only targeted node
      this.remove();
    }

    // Array field matching
    if (Array.isArray(node)) {
      // Filter out object matching the "tags"
      if (filterArray.length > 0 && this.key === 'tags' && filterArray.some(i => node.includes(i))) {
        // debugFilterStep = 'Filter - tags'
        // Top parent has other nodes, so remove only targeted parent node of matching element
        this.parent.delete();
      }
    }

    // Single field matching
    if (typeof node !== 'object' && !Array.isArray(node)) {
      // Filter out fields matching the flags
      if (filterProps.length > 0 && filterProps.includes(this.key)) {
        // debugFilterStep = 'Filter - Single field - flags'
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
      // debugFilterStep = 'Filter - Remove empty objects'
      this.delete();
    }
    // Remove path items without operations
    // if (this.parent && this.parent.key === 'messages' && !operationVerbs.some(i => this.keys.includes(i))) {
    //     this.delete();
    // }
  });

  // Return result object
  return {data: jsonObj, resultData: {unusedComp: unusedComp}}
}

/**
 * AsyncAPI Change Case function
 * Traverse through all keys and based on the key name, change the case the props according to the casing configuration.
 * @param {object} asObj AsyncAPI document
 * @param {object} options AsyncAPI-format casing options
 * @returns {object} Formatted casing AsyncAPI document
 */
function asyncapiChangeCase(asObj, options) {
  let jsonObj = JSON.parse(JSON.stringify(asObj)); // Deep copy of the schema object
  let defaultCasing = {}; // JSON.parse(fs.readFileSync(__dirname + "/defaultFilter.json", 'utf8'))
  let casingSet = Object.assign({}, defaultCasing, options.casingSet);

  let debugCasingStep = '' // uncomment // debugFilterStep below to see which sort part is triggered

  // Recursive traverse through OpenAPI document to update components
  traverse(jsonObj).forEach(function (node) {
    // Focus only on the components
    if (this.path[0] === 'components') {
      // Change components/schemas - names
      if (this.path[1] === 'schemas' && this.path.length === 2 && casingSet.componentsSchemas) {
        // debugCasingStep = 'Casing - components/schemas - names
        this.update(changeObjKeysCase(node, casingSet.componentsSchemas));
      }
      // Change components/messages - names
      if (this.path[1] === 'messages' && this.path.length === 2 && casingSet.componentsMessages) {
        // debugCasingStep = 'Casing - components/messages - names
        this.update(changeObjKeysCase(node, casingSet.componentsMessages));
      }
      // Change components/messageTraits - names
      if (this.path[1] === 'messageTraits' && this.path.length === 2 && casingSet.componentsMessageTraits) {
        // debugCasingStep = 'Casing - components/messageTraits - names
        this.update(changeObjKeysCase(node, casingSet.componentsMessageTraits));
      }
      // Change components/operationTraits - names
      if (this.path[1] === 'operationTraits' && this.path.length === 2 && casingSet.componentsOperationTraits) {
        // debugCasingStep = 'Casing - components/operationTraits - names
        this.update(changeObjKeysCase(node, casingSet.componentsOperationTraits));
      }
      // Change components/parameters - names
      if (this.path[1] === 'parameters' && this.path.length === 2 && casingSet.componentsParameters) {
        // debugCasingStep = 'Casing - components/parameters - names
        this.update(changeObjKeysCase(node, casingSet.componentsParameters));
      }
      // Change components/securitySchemes - names
      if (this.path[1] === 'securitySchemes' && this.path.length === 2 && casingSet.componentsSecuritySchemes) {
        // debugCasingStep = 'Casing - components/securitySchemes - names
        this.update(changeObjKeysCase(node, casingSet.componentsSecuritySchemes));
      }
    }
  });

  // Recursive traverse through AsyncAPI document for non-components
  traverse(jsonObj).forEach(function (node) {
    // Change components $ref names
    if (this.key === '$ref') {
      if (node.startsWith('#/components/schemas/') && casingSet.componentsSchemas) {
        const compName = node.replace('#/components/schemas/', '');
        this.update(`#/components/schemas/${changeCase(compName, casingSet.componentsSchemas)}`);
      }
      if (node.startsWith('#/components/messages/') && casingSet.componentsMessages) {
        const compName = node.replace('#/components/messages/', '');
        this.update(`#/components/messages/${changeCase(compName, casingSet.componentsMessages)}`);
      }
      if (node.startsWith('#/components/messageTraits/') && casingSet.componentsMessageTraits) {
        const compName = node.replace('#/components/messageTraits/', '');
        this.update(`#/components/messageTraits/${changeCase(compName, casingSet.componentsMessageTraits)}`);
      }
      if (node.startsWith('#/components/operationTraits/') && casingSet.componentsOperationTraits) {
        const compName = node.replace('#/components/operationTraits/', '');
        this.update(`#/components/operationTraits/${changeCase(compName, casingSet.componentsOperationTraits)}`);
      }
      if (node.startsWith('#/components/parameters/') && casingSet.componentsParameters) {
        const compName = node.replace('#/components/parameters/', '');
        this.update(`#/components/parameters/${changeCase(compName, casingSet.componentsParameters)}`);
      }
      if (node.startsWith('#/components/securitySchemes/') && casingSet.componentsSecuritySchemes) {
        const compName = node.replace('#/components/securitySchemes/', '');
        this.update(`#/components/securitySchemes/${changeCase(compName, casingSet.componentsSecuritySchemes)}`);
      }
    }

    // Change operationId
    if (this.key === 'operationId' && casingSet.operationId && this.path[0] === 'channels' && this.path.length === 4) {
      // debugCasingStep = 'Casing - Single field - OperationId'
      this.update(changeCase(node, casingSet.operationId));
    }
    // Change channels - channel key
    if (this.key === 'channels' && casingSet.channels && this.path[0] === 'channels') {
      // debugCasingStep = 'Casing -Channels - channel key'
      this.update(changeObjKeysCase(node, casingSet.channels));
    }
    // Change summary
    if (this.key === 'summary' && casingSet.summary) {
      // debugCasingStep = 'Casing - Single field - summary'
      this.update(changeCase(node, casingSet.summary));
    }
    // Change description
    if (this.key === 'description' && casingSet.description) {
      // debugCasingStep = 'Casing - Single field - description'
      this.update(changeCase(node, casingSet.description));
    }
    // Change channels > parameters - name
    if (this.path[0] === 'channels' && this.key === 'parameters' && casingSet.componentsParameters) {
      // debugCasingStep = 'Casing - Single field - parameters name'
      this.update(changeObjKeysCase(node, casingSet.componentsParameters));
    }
    // Change components/schemas - properties
    if (this.path[1] === 'schemas' && this.key === 'properties' && casingSet.properties
      && (this.parent && this.parent.key !== 'properties' && this.parent.key !== 'value')
    ) {
      // debugCasingStep = 'Casing - components/schemas - properties name'
      this.update(changeObjKeysCase(node, casingSet.properties));
    }
    // Change components/messages - properties
    if (this.path[1] === 'messages' && this.key === 'properties' && casingSet.properties
      && (this.parent && this.parent.key !== 'properties' && this.parent.key !== 'value')
    ) {
      // debugCasingStep = 'Casing - components/messages - properties name'
      this.update(changeObjKeysCase(node, casingSet.properties));
    }
    // Change components/messageTraits - properties
    if (this.path[1] === 'messageTraits' && this.key === 'properties' && casingSet.properties
      && (this.parent && this.parent.key !== 'properties' && this.parent.key !== 'value')
    ) {
      // debugCasingStep = 'Casing - components/messages - properties name'
      this.update(changeObjKeysCase(node, casingSet.properties));
    }
    // Change channels > message - properties
    if (this.path[0] === 'channels' && this.key === 'properties' && casingSet.properties
      && (this.parent && this.parent.key !== 'properties' && this.parent.key !== 'value')
    ) {
      // debugCasingStep = 'Casing - channels > message - properties name'
      this.update(changeObjKeysCase(node, casingSet.properties));
    }
    // Change servers > - security - keys
    if (this.path[0] === 'servers' && this.key === 'security' && isArray(node) && casingSet.componentsSecuritySchemes) {
      // debugCasingStep = 'Casing - servers > - security'
      this.update(changeArrayObjKeysCase(node, casingSet.componentsSecuritySchemes))
    }
  });

  // Return result object
  return {data: jsonObj, resultData: {}}
}

/**
 * AsyncAPI rename function
 * Change the title of the AsyncAPi document with a provided value.
 * @param asObj AsyncAPI document
 * @param options AsyncAPI-format options
 * @returns {any} Renamed AsyncAPI document
 */
function asyncapiRename(asObj, options) {
  let jsonObj = JSON.parse(JSON.stringify(asObj)); // Deep copy of the schema object

  // AsyncAPI 2
  if (jsonObj.info && jsonObj.info.title && options.rename && options.rename !== "") {
    jsonObj.info.title = options.rename
  }

  // Return result object
  return {data: jsonObj, resultData: {}}
}

/**
 * Value replacement function
 * @param {string} valueAsString
 * @param {array} replacements
 * @returns {*}
 */
function valueReplace(valueAsString, replacements) {
  if (!isString(valueAsString)) return valueAsString
  if (!isArray(replacements)) return valueAsString

  replacements.map(({searchFor, replaceWith}) => {
    const pattern = searchFor.replace(/"/g, '\\\\"')
    const replacement = replaceWith.replace(/"/g, '\\"')
    valueAsString = valueAsString.replace(new RegExp(escapeRegExp(pattern), 'g'), replacement);
    return valueAsString
  })

  return valueAsString
}

/**
 * Change Object keys case function
 * @param {object} obj
 * @param {string} caseType
 * @returns {*}
 */
function changeObjKeysCase(obj, caseType) {
  if (!isObject(obj)) return obj

  const orgObj = JSON.parse(JSON.stringify(obj)); // Deep copy of the object
  let replacedItems = Object.keys(orgObj).map((key) => {
    const newKey = changeCase(key, caseType);
    return {[newKey]: orgObj[key]};
  });
  return Object.assign({}, ...replacedItems)
}

/**
 * Change object keys case in array  function
 * @param {object} node
 * @param {string} caseType
 * @returns {*}
 */
function changeArrayObjKeysCase(node, caseType) {
  if (!isArray(node)) return node

  const casedNode = JSON.parse(JSON.stringify(node)); // Deep copy of the schema object
  for (let i = 0; i < casedNode.length; i++) {
    casedNode[i] = changeObjKeysCase(casedNode[i], caseType)
  }
  return casedNode
}

/**
 * Change case function
 * @param {string} valueAsString
 * @param {string} caseType
 * @returns {string}
 */
function changeCase(valueAsString, caseType) {
  if (!isString(valueAsString) || valueAsString === "") return valueAsString
  const keepChars = ['$', '@']
  const normCaseType = camelCase(caseType)

  switch (normCaseType) {
    case "camelCase":
      return camelCase(valueAsString, {keep: keepChars})
    case "pascalCase":
    case "upperCamelCase":
      return pascalCase(valueAsString, {keep: keepChars})
    case "kebabCase":
    case "kebapCase":
      return kebabCase(valueAsString, {keep: keepChars})
    case "trainCase":
    case "capitalKebabCase":
    case "capitalKebapCase":
      return trainCase(valueAsString, {keep: keepChars})
    case "snakeCase":
      return snakeCase(valueAsString, {keep: keepChars})
    case "adaCase":
      return adaCase(valueAsString, {keep: keepChars})
    case "constantCase":
      return constantCase(valueAsString, {keep: keepChars})
    case "cobolCase":
      return cobolCase(valueAsString, {keep: keepChars})
    case "dotNotation":
      return dotNotation(valueAsString, {keep: keepChars})
    case "spaceCase":
      return spaceCase(valueAsString, {keep: keepChars})
    case "capitalCase":
      return capitalCase(valueAsString, {keep: keepChars})
    case "lowerCase":
      return lowerCase(valueAsString, {keep: keepChars})
    case "upperCase":
      return upperCase(valueAsString, {keep: keepChars})
    default:
      return valueAsString
  }
}


module.exports = {
  asyncapiFilter: asyncapiFilter,
  asyncapiSort: asyncapiSort,
  asyncapiChangeCase: asyncapiChangeCase,
  asyncapiRename: asyncapiRename,
  changeCase: changeCase
};
