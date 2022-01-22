#!/usr/bin/env node
"use strict";

const fs = require('fs');
const traverse = require('traverse');
const {isString, isArray, isObject} = require("./util-types");
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
async function asyncapiSort(oaObj, options) {
  // Skip sorting, when the option "no-sort" is set
  if (options.sort === false) {
    return oaObj;
  }

  let jsonObj = JSON.parse(JSON.stringify(oaObj)); // Deep copy of the schema object
  let sortSet = options.sortSet || JSON.parse(fs.readFileSync(__dirname + "/defaultSort.json", 'utf8'));
  let sortComponentsSet = options.sortComponentsSet || JSON.parse(fs.readFileSync(__dirname + "/defaultSortComponents.json", 'utf8'));
  let debugStep = '' // uncomment // debugStep below to see which sort part is triggered

  // Recursive traverse through AsyncAPI document
  traverse(jsonObj).forEach(function (node) {
    // if (obj.hasOwnProperty(this.key) && obj[this.key] && typeof obj[this.key] === 'object') {
    if (typeof node === 'object') {

      // Components sorting by alphabet
      if (this.parent && this.parent.key && this.path[0] === 'components' && this.parent.key === 'components'
        && sortComponentsSet.length > 0 && sortComponentsSet.includes(this.key)
      ) {
        // debugStep = 'Component sorting by alphabet'
        let sortedObj = JSON.parse(JSON.stringify(node)); // Deep copy of the schema object
        node = prioritySort(sortedObj, []);
        this.update(node);
      }

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
async function asyncapiFilter(oaObj, options) {
  let jsonObj = JSON.parse(JSON.stringify(oaObj)); // Deep copy of the schema object
  let defaultFilter = JSON.parse(fs.readFileSync(__dirname + "/defaultFilter.json", 'utf8'))
  let filterSet = Object.assign({}, defaultFilter, options.filterSet);
  const operationVerbs = ["subscribe", "publish"];
  const fixedFlags = ["x-asyncapi-format-filter"]
  options.unusedDepth = options.unusedDepth || 0;

  // Merge object filters
  const filterKeys = [...filterSet.operations];
  const filterArray = [...filterSet.tags];
  const filterProps = [...filterSet.operationIds, ...filterSet.flags, ...fixedFlags];

  // Inverse object filters
  const inverseFilterKeys = [...filterSet.inverseOperations];
  const inverseFilterProps = [...filterSet.inverseOperationIds];
  const inverseFilterArray = [...filterSet.inverseTags];

  const stripFlags = [...filterSet.stripFlags];
  const stripUnused = [...filterSet.unusedComponents];
  const textReplace = filterSet.textReplace || [];

  // Convert flag values to flags
  const filterFlagValuesKeys = Object.keys(Object.assign({}, ...filterSet.flagValues));
  const filterFlagValues = [...filterSet.flagValues];
  const filterFlagHash = filterFlagValues.map(o => (JSON.stringify(o)));

  // Initiate components tracking
  const comps = {
    schemas: {},
    messages: {},
    parameters: {},
    messageTraits: {},
    operationTraits: {},
    meta: {total: 0}
  }

  // Prepare unused components
  let unusedComp = {
    schemas: [],
    messages: [],
    parameters: [],
    messageTraits: [],
    operationTraits: [],
    meta: {total: 0}
  }
  // Use options.unusedComp to collect unused components during multiple recursion
  if (!options.unusedComp) options.unusedComp = JSON.parse(JSON.stringify(unusedComp));

  let debugFilterStep = '' // uncomment // debugFilterStep below to see which sort part is triggered

  traverse(jsonObj).forEach(function (node) {
    // Register components presence
    if (get(this, 'parent.parent.key') && this.parent.parent.key === 'components') {
      if (get(this, 'parent.key') && this.parent.key && comps[this.parent.key]) {
        comps[this.parent.key][this.key] = {...comps[this.parent.key][this.key], present: true};
        comps.meta.total = comps.meta.total++;
      }
    }

    // Register components usage
    if (this.key === '$ref') {
      if (node.startsWith('#/components/schemas/')) {
        const compSchema = node.replace('#/components/schemas/', '');
        comps.schemas[compSchema] = {...comps.schemas[compSchema], used: true};
      }
      if (node.startsWith('#/components/messages/')) {
        const compMess = node.replace('#/components/messages/', '');
        comps.messages[compMess] = {...comps.messages[compMess], used: true};
      }
      if (node.startsWith('#/components/parameters/')) {
        const compParam = node.replace('#/components/parameters/', '');
        comps.parameters[compParam] = {...comps.parameters[compParam], used: true};
      }
      if (node.startsWith('#/components/messageTraits/')) {
        const compMessTraits = node.replace('#/components/messageTraits/', '');
        comps.messageTraits[compMessTraits] = {...comps.messageTraits[compMessTraits], used: true};
      }
      if (node.startsWith('#/components/operationTraits/')) {
        const compOpTraits = node.replace('#/components/operationTraits/', '');
        comps.operationTraits[compOpTraits] = {...comps.operationTraits[compOpTraits], used: true};
      }
    }

    // Filter out object matching the inverse "operations"
    if (inverseFilterKeys.length > 0 && !inverseFilterKeys.includes(this.key) && operationVerbs.includes(this.key)
      && this.path[0] === 'channels' && this.level === 3) {
      // debugFilterStep = 'Filter - inverse operations'
      this.remove();
    }

    // Filter out object matching the "operations"
    if (filterKeys.length > 0 && filterKeys.includes(this.key)) {
      // debugFilterStep = 'Filter - operations'
      this.remove();
    }

    // Filter out fields without operationIds, when Inverse operationIds is set
    if (inverseFilterProps.length > 0 && this.path[0] === 'channels' && node.operationId === undefined
      && operationVerbs.includes(this.key)
    ) {
      // debugFilterStep = 'Filter - Single field - Inverse operationIds without operationIds'
      this.remove();
    }

    // Filter out operations not matching channels > tags, when Inverse tags is set
    if (inverseFilterArray.length > 0 && this.path[0] === 'channels' && this.level === 2 && node.tags === undefined) {
      // debugFilterStep = 'Filter - Single field - Inverse tags without tags'
      this.remove();
    }

    // Array field matching
    if (Array.isArray(node)) {
      // Filter out object matching the inverse "tags"
      if (inverseFilterArray.length > 0 && this.key === 'tags' && this.path[0] === 'channels'
        && !node.some(e => inverseFilterArray.includes(e.name))) {
        // debugFilterStep = 'Filter - inverse tags'
        this.parent.delete();
      }

      // Filter out the top level tags matching the inverse "tags"
      if (inverseFilterArray.length > 0 && this.key === 'tags' && this.path[0] === 'tags' && this.level === 0) {
        // debugFilterStep = 'Filter - inverse top tags'
        node = node.filter(value => inverseFilterArray.includes(value.name))
        this.update(node);
      }

      // Filter out object matching the "tags"
      if (filterArray.length > 0 && this.key === 'tags' && filterArray.some(i => node.includes(i))) {
        // debugFilterStep = 'Filter - tags'
        // Top parent has other nodes, so remove only targeted parent node of matching element
        this.parent.delete();
      }

      // Filter out the top OpenApi.tags matching the "tags"
      if (filterArray.length > 0 && this.key === 'tags' && this.path[0] === 'tags') {
        // debugFilterStep = 'Filter - top tags'
        node = node.filter(value => !filterArray.includes(value.name))
        this.update(node);
      }

      // Filter out fields matching the flagValues
      if (filterFlagValuesKeys.length > 0 && filterFlagValuesKeys.includes(this.key)) {
        for (let i = 0; i < node.length; i++) {
          const itmObj = {[this.key]: node[i]};
          const itmObjHash = JSON.stringify(itmObj);
          if (filterFlagHash.some(filterFlag => filterFlag === itmObjHash)) {
            // ========================================================================
            // HACK to overcome the issue with removing items from an array
            if (get(this, 'parent.parent.key') && this.parent.parent.key === 'x-tagGroups') {
              // debugFilterStep = 'Filter -x-tagGroups - flagValues - array value'
              const tagGroup = this.parent.node
              tagGroup['x-openapi-format-filter'] = true
              this.parent.update(tagGroup)
              // ========================================================================
            } else {
              // debugFilterStep = 'Filter - Single field - flagValues - array value'
              this.parent.remove();
            }
          }
        }
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

      // Filter out fields matching the flagValues
      if (filterFlagValuesKeys.length > 0 && filterFlagValuesKeys.includes(this.key)) {
        const itmObj = {[this.key]: node};
        const itmObjHash = JSON.stringify(itmObj);
        if (filterFlagHash.some(filterFlagHash => filterFlagHash === itmObjHash)) {
          // ========================================================================
          // HACK to overcome the issue with removing items from an array
          if (get(this, 'parent.parent.key') && this.parent.parent.key === 'x-tagGroups') {
            // debugFilterStep = 'Filter -x-tagGroups - flagValues - single value'
            const tagGroup = this.parent.node
            tagGroup['x-asyncapi-format-filter'] = true
            this.parent.update(tagGroup)
            // ========================================================================
          } else {
            // debugFilterStep = 'Filter - Single field - flagValues - single value'
            this.parent.remove();
          }
        }
      }

      // Filter out fields matching the inverse operationIds
      if (inverseFilterProps.length > 0 && this.key === 'operationId' && !inverseFilterProps.includes(node)) {
        // debugFilterStep = 'Filter - Single field - Inverse operationIds'
        this.parent.remove();
      }

      // Filter out fields matching the operationIds
      if (filterProps.length > 0 && filterProps.includes(node) && (this.key === 'operationId')) {
        // debugFilterStep = 'Filter - Single field - operationIds'
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

    // Filter out markdown comments in description fields
    if (this.key === 'description' && isString(node)) {
      const lines = node.split('\n');
      if (lines.length > 1) {
        const filtered = lines.filter(line => !line.startsWith('[comment]: <>'))
        const cleanDescription = filtered.join('\n');
        this.update(cleanDescription)
        node = cleanDescription
      }
    }

    // Replace words in text with new value
    if (isString(node) && textReplace.length > 0
      && (this.key === 'description' || this.key === 'summary' || this.key === 'url')) {
      const replaceRes = valueReplace(node, textReplace);
      this.update(replaceRes);
      node = replaceRes
    }
  });

  if (stripUnused.length > 0) {
    const optFs = get(options, 'filterSet.unusedComponents', []) || [];
    unusedComp.schemas = Object.keys(comps.schemas || {}).filter(key => !isUsedComp(comps.schemas, key)); //comps.schemas[key]?.used);
    if (optFs.includes('schemas')) options.unusedComp.schemas = [...options.unusedComp.schemas, ...unusedComp.schemas];
    unusedComp.messages = Object.keys(comps.messages || {}).filter(key => !isUsedComp(comps.messages, key));//!comps.messages[key]?.used);
    if (optFs.includes('messages')) options.unusedComp.messages = [...options.unusedComp.messages, ...unusedComp.messages];
    unusedComp.parameters = Object.keys(comps.parameters || {}).filter(key => !isUsedComp(comps.parameters, key));//!comps.parameters[key]?.used);
    if (optFs.includes('parameters')) options.unusedComp.parameters = [...options.unusedComp.parameters, ...unusedComp.parameters];
    unusedComp.messageTraits = Object.keys(comps.messageTraits || {}).filter(key => !isUsedComp(comps.messageTraits, key));//!comps.messageTraits[key]?.used);
    if (optFs.includes('messageTraits')) options.unusedComp.messageTraits = [...options.unusedComp.messageTraits, ...unusedComp.messageTraits];
    unusedComp.operationTraits = Object.keys(comps.operationTraits || {}).filter(key => !isUsedComp(comps.operationTraits, key));//!comps.operationTraits[key]?.used);
    if (optFs.includes('operationTraits')) options.unusedComp.operationTraits = [...options.unusedComp.operationTraits, ...unusedComp.operationTraits];
    unusedComp.meta.total = unusedComp.schemas.length + unusedComp.messages.length + unusedComp.parameters.length + unusedComp.messageTraits.length + unusedComp.operationTraits.length
  }

  // Clean-up jsonObj
  traverse(jsonObj).forEach(function (node) {
    // Remove unused component
    if (this.path[0] === 'components' && stripUnused.length > 0) {
      if (stripUnused.includes(this.path[1]) && unusedComp[this.path[1]].includes(this.key)) {
        // debugFilterStep = 'Filter - Remove unused components'
        this.delete();
      }
    }
    // Remove empty objects
    if (node && Object.keys(node).length === 0 && node.constructor === Object && this.parent.key !== 'security') {
      // debugFilterStep = 'Filter - Remove empty objects'
      this.delete();
    }
    // Strip flags
    if (stripFlags.length > 0 && stripFlags.includes(this.key)) {
      // debugFilterStep = 'Filter - Strip flags'
      this.delete();
    }
  });

  // Recurse to strip any remaining unusedComp, to a maximum depth of 10
  if (stripUnused.length > 0 && unusedComp.meta.total > 0 && options.unusedDepth <= 10) {
    options.unusedDepth++;
    const resultObj = await asyncapiFilter(jsonObj, options);
    jsonObj = resultObj.data;
    unusedComp = JSON.parse(JSON.stringify(options.unusedComp));
  }

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
async function asyncapiChangeCase(asObj, options) {
  let jsonObj = JSON.parse(JSON.stringify(asObj)); // Deep copy of the schema object
  let defaultCasing = {}; // JSON.parse(fs.readFileSync(__dirname + "/defaultFilter.json", 'utf8'))
  let casingSet = Object.assign({}, defaultCasing, options.casingSet);

  let debugCasingStep = '' // uncomment // debugCasingStep below to see which sort part is triggered

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
async function asyncapiRename(asObj, options) {
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
 * Change object keys case in array function
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

/**
 * Function for escaping input to be treated as a literal string within a regular expression
 * @param string
 * @returns {*}
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Alternative optional chaining function, to provide support for NodeJS 12
 * TODO replace this with native ?. optional chaining once NodeJS12 is deprecated.
 * @param obj object
 * @param path path to access the properties
 * @param defaultValue
 * @returns {T}
 */
function get(obj, path, defaultValue = undefined) {
  const travel = regexp => String.prototype.split.call(path, regexp)
    .filter(Boolean).reduce((res, key) => res !== null && res !== undefined ? res[key] : res, obj);

  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}

/**
 * Validate function if component contains a used property
 * @param obj
 * @param prop
 * @returns {boolean}
 */
function isUsedComp(obj, prop) {
  if (!isObject(obj)) return false
  if (!isString(prop)) return false
  const comp = obj[prop]
  if (comp.used && comp.used === true) return true
  return false
}

module.exports = {
  asyncapiFilter: asyncapiFilter,
  asyncapiSort: asyncapiSort,
  asyncapiChangeCase: asyncapiChangeCase,
  asyncapiRename: asyncapiRename,
  changeCase: changeCase
};
