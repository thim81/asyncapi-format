![asyncapi-format icon](./assets/asyncapi-format-logo.svg)

<a href="https://www.npmjs.com/package/asyncapi-format" alt="Latest Stable Version">![npm](https://img.shields.io/npm/v/asyncapi-format.svg)</a>
<a href="https://www.npmjs.com/package/asyncapi-format" alt="Total Downloads">![npm](https://img.shields.io/npm/dw/asyncapi-format.svg)</a>

# asyncapi-format

Format an AsyncAPI document by ordering, formatting and filtering fields.

The asyncapi-format CLI can load an AsyncAPI file, sorts the AsyncAPI fields by ordering them in a hierarchical order, format the casing of the fields and
can output the file with clean indenting, to either JSON or YAML.

Next to the ordering & formatting, the CLI provides additional options to filter fields & parts of the AsyncAPI document based on
flags, tags, operations and operationID's.

This `asyncapi-format` CLI is based on [openapi-format](https://github.com/thim81/openapi-format) as a separate
package to allow customisation specific for AsyncAPI use-cases.

## Table of content
* [Use-cases](#use-cases)
* [Features](#features)
* [Installation](#installation)
    + [Local Installation (recommended)](#local-installation-recommended)
    + [Global Installation](#global-installation)
    + [NPX usage](#npx-usage)
* [Command Line Interface](#command-line-interface)
* [AsyncAPI format CLI options](#asyncapi-format-cli-options)
* [AsyncAPI sort configuration options](#asyncapi-sort-configuration-options)
* [AsyncAPI formatting configuration options](#asyncapi-formatting-configuration-options)
* [AsyncAPI filter options](#asyncapi-filter-options)
* [CLI sort usage](#cli-sort-usage)
* [CLI filter usage](#cli-filter-usage)
* [CLI rename usage](#cli-rename-usage)
* [CLI configuration usage](#cli-configuration-usage)
* [Credits](#credits)

## Use-cases

When working on large AsyncAPI documents or with multiple team members, the file can be become messy and difficult to
compare changes. By sorting & formatting from time to time, the fields are all ordered in a structured manner & properly cased, which will help you
to maintain the file with greater ease.

The filtering is a handy add-on to remove specific elements from the AsyncAPI like internal endpoints, beta tags, ...
This can be useful in CI/CD pipelines, where the AsyncAPI is used as the source for other documents like Web documentation
or for generating event producers/consumers.

## Features

- [x] Order AsyncAPI fields in a default order
- [x] Order AsyncAPI fields in a custom order
- [x] Order Components elements by alphabet
- [x] Format the casing (camelCase,PascalCase, ...) of component elements
- [x] Filter AsyncAPI files based on operations
- [x] Filter AsyncAPI files based on flags
- [x] Filter AsyncAPI files based on flags values
- [x] Filter AsyncAPI files based on tags
- [x] Filter AsyncAPI files based on operationID's
- [x] Strip flags from AsyncAPI files
- [x] Strip unused components from AsyncAPI files
- [x] Rename the AsyncAPI title
- [x] Support AsyncAPI documents in JSON format
- [x] Support AsyncAPI documents in YAML format
- [x] Format via CLI
- [x] Format via config files
- [x] Use as a Module
- [x] Support for AsyncAPI 2.x

## Installation

### Local Installation (recommended)

While possible to install globally, we recommend that you add the asyncapi-format CLI to the `node_modules` by using:

```shell
$ npm install --save asyncapi-format
```

or using yarn...

```shell
$ yarn add asyncapi-format
```

Note that this will require you to run the asyncapi-format CLI with `npx asyncapi-format your-asyncapi-file.yaml` or, if
you are using an older versions of npm, `./node_modules/.bin/asyncapi-format your-asyncapi-file.yaml`.

### Global Installation

```shell
$ npm install -g asyncapi-format
```

### NPX usage

To execute the CLI without installing it via npm, use the npx method

```shell
$ npx asyncapi-format your-asyncapi-file.yaml
```

## Command Line Interface

```
asyncapi-format.js <input-file> -o [ouptut-file] [options]

Arguments:
  infile   the AsyncAPI document, can be either a .json or .yaml file
  outfile  the output file is optional and be either a .json or .yaml file. Files that end in `.json` will be formatted 
  as JSON files that end in `.yaml` or `.yml` will be YAML format
  

Options:

  --output, -o          Save the formated AsyncAPI file as JSON/YAML            [path]
  
  --sortFile            The file to specify custom AsyncAPI fields ordering     [path]
  --casingFile          The file to specify casing rules                        [path]
  --filterFile          The file to specify filter rules                        [path]
    
  --no-sort             Don't sort the AsyncAPI file                         [boolean]
  --sortComponentsFile  The file with components to sort alphabetically         [path]
  
  --rename              Rename the AsyncAPI title                             [string]

  --configFile          The file with the AsyncAPI-format CLI options           [path]
  
  --lineWidth           Max line width of YAML output                         [number]
  
  --json                Prints the file to stdout as JSON                    [boolean]
  --yaml                Prints the file to stdout as YAML                    [boolean]
  
  --help                Show help                                            [boolean]
  --verbose             Output more details of the filter process              [count]
```

## AsyncAPI format CLI options

| Parameter            | Alias         | Description                                                                 | Input type   | Default                    | Info      |
|----------------------|---------------|-----------------------------------------------------------------------------|--------------|----------------------------|-----------|
| file                 |               | the original AsyncAPI file                                                  | path to file |                            | required  |
| --output             | -o            | save the formatted AsyncAPI file as JSON/YAML                               | path to file |                            | optional  |
| --sortFile           | -s            | the file to specify custom AsyncAPI fields ordering                         | path to file | defaultSort.json           | optional  |
| --filterFile         | -f            | the file to specify filter setting                                          | path to file | defaultFilter.json         | optional  |
| --casingFile         | -c            | the file to specify casing setting                                          | path to file |                            | optional  |
| --no-sort            |               | don't sort the AsyncAPI file                                                | boolean      | FALSE                      | optional  |
| --sortComponentsFile |               | sort the items of the components (schemas, parameters, ...) by alphabet     | path to file | defaultSortComponents.json | optional  |
| --rename             |               | rename the AsyncAPI title                                                   | string       |                            | optional  |
| --configFile         | -c            | the file with all the format config options                                 | path to file |                            | optional  |
| --lineWidth          |               | max line width of YAML output                                               | number       | -1 (Infinity)              | optional  |
| --json               |               | prints the file to stdout as JSON                                           |              | FALSE                      | optional  |
| --yaml               |               | prints the file to stdout as YAML                                           |              | FALSE                      | optional  |
| --verbose            | -v, -vv, -vvv | verbosity that can be increased, which will show more output of the process |              |                            | optional  |
| --help               | h             | display help for command                                                    |              |                            | optional  |

## AsyncAPI sort configuration options

The CLI will sort the AsyncAPI document in the defined order liked defined per AsyncAPI key/element. The fields that are
not specified will keep their order like it is in the original AsyncAPI document, so only defined fields will be
re-ordered.

The default sorting based on the defined order (listed in the table below), which is stored in
the [defaultSort.json](https://github.com/thim81/asyncapi-format/blob/main/defaultSort.json) file.

You can easily modify this by specifying your own ordering per key, which can passed on to the CLI (see below for an
example on how to do this).

| Key         | Ordered by                                                                                                      | AsyncAPI reference         |
| ----------- | ----------------------------------------------------------------------------------------------------------------| -------------------------- |
| root        | - asyncapi<br>\- info<br>\- servers<br>\- channels<br>\- components<br>\- tags<br>\- externalDocs               | [AsyncAPI-object](https://www.asyncapi.com/docs/specifications/2.0.0#A2SObject) |
| channels    | - description<br>\- parameters<br>\- subscribe<br>\- publish<br>\- bindings                                     | [channels-item-object](https://www.asyncapi.com/docs/specifications/2.0.0#channelItemObject) |
| parameters  | - name<br>\- in<br>\- description<br>\- required<br>\- schema                                                   | [parameters-object](https://www.asyncapi.com/docs/specifications/2.0.0#parametersObject) |
| subscribe   | - operationId<br>\- summary<br>\- description<br>\- message<br>\- traits<br>\- tags                             | [operation-object](https://www.asyncapi.com/docs/specifications/2.0.0#operationObject) |
| publish     | - operationId<br>\- summary<br>\- description<br>\- message<br>\- traits<br>\- tags                             | [operation-object](https://www.asyncapi.com/docs/specifications/2.0.0#operationObject) |
| messages    | - name<br>\- title<br>\- summary<br>\- description<br>\- headers<br>\- payload<br>\- contentType                | [message-object](https://www.asyncapi.com/docs/specifications/2.0.0#messageObject) |
| payload     | - description<br>\- type<br>\- items<br>\- properties<br>\- format<br>\- example<br>\- default                  | [schema-object](https://www.asyncapi.com/docs/specifications/2.0.0#schemaObject) |
| components  | - parameters<br>\- messages  <br>\- schemas                                                                     | [components-object](https://www.asyncapi.com/docs/specifications/2.0.0#componentsObject) |
| schema      | - description<br>\- type<br>\- items<br>\- properties<br>\- format<br>\- example<br>\- default                  | [schema-object](https://www.asyncapi.com/docs/specifications/2.0.0#schemaObject) |
| schemas     | - description<br>\- type<br>\- items<br>\- properties<br>\- format<br>\- example<br>\- default                  |                                                                           |
| properties  | - description<br>\- type<br>\- items<br>\- format<br>\- example<br>\- default<br>\- enum                        |                                                                           |

Have a look at the folder [yaml-default](test/yaml-default) and compare the "output.yaml" (sorted document) with the "input.yaml" (original document), to see how asyncapi-format have sorted the AsyncAPI document.

## AsyncAPI filter options

By specifying the desired filter values for the available filter types, the asyncapi-format CLI will strip out any
matching item from the AsyncAPI document. You can combine multiple types to filter out a range of AsyncAPI items.

For more complex use-cases, we can advise the excellent https://github.com/Mermade/openapi-filter package, which has 
extended options for filtering AsyncAPI documents.

| Type                | Description                         | Type  | Examples                                    |
|---------------------|-------------------------------------|-------|---------------------------------------------|
| operations          | AsyncAPI operations.                | array | ['subscribe','publish']                     |
| tags                | AsyncAPI tags.                      | array | ['measure','command']                       |
| operationIds        | AsyncAPI operation ID's.            | array | ['turnOff','dimLight']                      |
| flags               | Custom flags                        | array | ['x-exclude','x-internal']                  |
| flagValues          | Custom flags with a specific value  | array | ['x-version: 1.0','x-version: 3.0']       |
| unusedComponents    | Unused components                   | array | ['examples','schemas']                      |
| stripFlags          | Custom flags that will be stripped  | array | ['x-exclude','x-internal']                  |
| textReplace         | Search & replace values to replace  | array | [{'searchFor':'API','replaceWith':'Event'}] |

Some more details on the available filter types:

### Filter - operations

=> **operations**: Refers to the "Channel Item Object" https://www.asyncapi.com/docs/specifications/2.0.0#channelsObject

This will remove all fields and attached fields that match the verbs. In the example below, this would mean that
all `publish`, `subscribe` items would be removed from the AsyncAPI document.

```yaml
channels:
    smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured:
        publish:
            summary: Inform about environmental lighting conditions of a particular streetlight.
            operationId: receiveLightMeasurement
            traits:
                - $ref: '#/components/operationTraits/kafka'
            message:
                $ref: '#/components/messages/lightMeasured'
        subscribe:
            operationId: turnOn
            traits:
                - $ref: '#/components/operationTraits/kafka'
            message:
                $ref: '#/components/messages/turnOnOff'
```

### Filter - tags

=> **tags**: Refers to the "tags" field from the "Operation
  Object" https://www.asyncapi.com/docs/specifications/2.0.0#operationObject

This will remove all fields and attached fields that match the tags. In the example below, this would mean that all
items with the tags `command` or `measure` would be removed from the AsyncAPI document.

For example:

```yaml
asyncapi: 2.0.0
info:
    title: Streetlights API
    version: 1.0.0
tags:
    - name: command
      description: Light commands
    - name: measure
      description: Measurement data
components:
    messages:
        lightMeasured:
            name: lightMeasured
            title: Light measured
            summary: Inform about environmental lighting conditions of a particular streetlight.
            contentType: application/json
            traits:
                - $ref: '#/components/messageTraits/commonHeaders'
            payload:
                $ref: "#/components/schemas/lightMeasuredPayload"
            tags:
                - measure
```

### Filter - operationIds

=> **operationIds**: Refers to the "operationId" field from the "Operation
  Object" https://www.asyncapi.com/docs/specifications/2.0.0#operationObject

This will remove specific fields and attached fields that match the operation ID's. In the example below, this would
mean that the item with operationID `turnOff` would be removed from the AsyncAPI document.

For example:

```yaml
asyncapi: 2.0.0
info:
    title: Streetlights API
    version: 1.0.0
channels:
    smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured:
        subscribe:
            operationId: turnOn
```

### Filter - flags

=> **flags**: Refers to a custom property that can be set on any field in the AsyncAPI document.

This will remove all fields and attached fields that match the flags. In the example below, this would mean that all
items with the flag `x-exclude` would be removed from the AsyncAPI document.

For example:

```yaml
asyncapi: 2.0.0
info:
    title: Streetlights API
    version: 1.0.0
channels:
    smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured:
        description: The topic on which measured values may be produced and consumed.
        x-exclude: true
        subscribe:
            operationId: turnOn
```
### Filter - flagValues

=> **flagValues**: Refers to a flag, custom property which can be set on any field in the AsyncAPI document, and the combination with the value for that flag.

This will remove all fields and attached fields that match the flag with the specific value. 

A `flagValues` example:

```yaml
flagValues:
    - x-version: 1.0
    - x-version: 3.0
```
In the example below, this would mean that all items with the flag `x-version` that matches `x-version: 1.0` OR `x-version: 3.0` would be removed from the AsyncAPI document.

```yaml
asyncapi: '2.2.0'
info:
    title: Streetlights Kafka API
channels:
    smartylighting.streetlights.1.0.event.{streetlightId}.lighting.measured:
        x-version: 1.0
```

The filter option `flagValues` also will remove flags that contain an array of values in the AsyncAPI document.

A `flagValues` example:

```yaml
flagValues:
    - x-versions: 1.0
    - x-versions: 2.0
```

In the example below, this would mean that all items with the flag `x-versions`, which is an array, that match `x-version: 1.0` OR `x-version: 3.0` would be removed from the AsyncAPI document.

```yaml
asyncapi: '2.2.0'
info:
    title: Streetlights Kafka API
channels:
    smartylighting.streetlights.1.0.event.{streetlightId}.lighting.measured:
        x-versions:
            - 1.0
            - 3.0
            - 5.0
```

Have a look at [flagValues](test/yaml-filter-custom-flagsvalue-value) and [flagValues for array values](test/yaml-filter-custom-flagsvalue-array) for a practical example.

### Filter - unusedComponents

=> **unusedComponents**: Refers to a list of [reusable component types](https://www.asyncapi.com/docs/specifications/2.0.0#componentsObject), from which unused items will be removed.

This option allows you to strip the AsyncAPI document from any unused items of the targeted `components` types.
Any item in the list of AsyncAPI `components` that is not referenced as `$ref`, will get marked and removed from the AsyncAPI document.

REMARK: We will recursively strip all unused components, with a maximum depth of 10 times. This means that "nested" components, that become unused, will also get removed

Supported component types that can be marked as "unused":
- schemas
- messages
- parameters
- messageTraits
- operationTraits

### Filter - textReplace

=> **textReplace**: "search & replace" option to replace text in the AsyncAPI specification

The `textReplace` provides a "search & replace" method, that will search for a text/word/characters in the AsyncAPI description, summary, URL fields and replace it with another text/word/characters.
This is very useful to replace data in the AsyncAPI specification.

A `textReplace` example:

```yaml
textReplace:
    - searchFor: 'DummyLighting'
      replaceWith: 'Smartylighting'
    - searchFor: 'apiasync.com/'
      replaceWith: 'asyncapi.com/'
```

This will replace all "DummyLighting" with "Smartylighting" & "apiasync.com/" with "asyncapi.com/" in the AsyncAPI document.

### Filter - stripFlags

=> **stripFlags**: Refers to a list of custom properties that can be set on any field in the AsyncAPI document.

The `stripFlags` will remove only the flags, the linked parent and properties will remain. In the example below, this would mean that all
flags `x-exclude` itself would be stripped from the AsyncAPI document.

Example before:

```yaml
asyncapi: 2.0.0
info:
    title: Streetlights API
    version: 1.0.0
channels:
    smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured:
        description: The topic on which measured values may be produced and consumed.
        x-exclude: true
        subscribe:
            operationId: turnOn
```

Example after:

```yaml
asyncapi: 2.0.0
info:
    title: Streetlights API
    version: 1.0.0
channels:
    smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured:
        description: The topic on which measured values may be produced and consumed.
        subscribe:
            operationId: turnOn
```

## AsyncAPI formatting configuration options

The asyncapi-format CLI formatting option can assist with keeping the field names consistent by automatically changing the casing of the properties/keys/names for the different elements in the AsyncAPI document.
The desired casing can be defined per AsyncAPI key/element (see list below).
The keys that are not specified will keep their casing like it is in the original AsyncAPI document, so only for defined fields, the casing will be changed.

| Key                        | Description                                                                               | AsyncAPI reference                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| channels                   | Changes key/name of the channels                                                          | [channels-object](https://www.asyncapi.com/docs/specifications/v2.2.0#channelsObject)|
| operationId                | Changes operation ID's that are part of the Operations Object                             | [operation-object](https://www.asyncapi.com/docs/specifications/v2.2.0#operationObject)|
| properties                 | Changes property keys of the schemas of the inline messages, payload & components         | [schemaObject](https://www.asyncapi.com/docs/specifications/v2.2.0#schemaObject) |
| componentsSchemas          | Changes the key of the schema models in the components sections & "$ref" links            | [components-object](https://www.asyncapi.com/docs/specifications/v2.2.0#componentsObject) |
| componentsMessages         | Changes the key of the messages models in the components sections & "$ref" links          | [components-object](https://www.asyncapi.com/docs/specifications/v2.2.0#componentsObject) |
| componentsParameters       | Changes the key of the parameters models in the components sections & "$ref" links        | [components-object](https://www.asyncapi.com/docs/specifications/v2.2.0#componentsObject) |
| componentsMessageTraits    | Changes the key of the message traits models in the components sections & "$ref" links    | [components-object](https://www.asyncapi.com/docs/specifications/v2.2.0#componentsObject) |
| componentsOperationTraits  | Changes the key of the operation traits models in the components sections & "$ref" links  | [components-object](https://www.asyncapi.com/docs/specifications/v2.2.0#componentsObject) |
| componentsSecuritySchemes  | Changes the key of the security schemes in the components sections & "$ref" links         | [components-object](https://www.asyncapi.com/docs/specifications/v2.2.0#componentsObject) |

### Casing options

| Casing type      | Casing alias | Description                                       | Example           |
| -----------------| ------------ | ------------------------------------------------- | ----------------- |
| 🐪 camelCase     | camelCase    | converts a strings to `camelCase`                 | `asyncapiFormat`  |
| 👨‍🏫 PascalCase    | PascalCase   | converts a strings to `PascalCase`                | `AsyncapiFormat`  |
| 🥙 kebab-case    | kebabCase    | converts a strings to `kebab-case`                | `asyncapi-format` |
| 🚂 Train-Case    | TrainCase    | converts a strings to `Train-Case`                | `Asyncapi-Format` |
| 🐍 snake_case    | snakeCase    | converts a strings to `snake_case`                | `asyncapi_format` |
| 🕊 Ada_Case      | AdaCase      | converts a strings to `Ada_Case`                  | `Asyncapi_Format` |
| 📣 CONSTANT_CASE | constantCase | converts a strings to `CONSTANT_CASE`             | `ASYNCAPI_FORMAT` |
| 👔 COBOL-CASE    | cobolCase    | converts a strings to `COBOL-CASE`                | `ASYNCAPI-FORMAT` |
| 📍 Dot.notation  | dotNotation  | converts a strings to `Dot.notation`              | `asyncapi.format` |
| 🛰 Space case    | spaceCase    | converts a strings to `Space case` (with spaces)  | `asyncapi format` |
| 🏛 Capital Case  | capitalCase  | converts a strings to `Capital Case` (with spaces)| `Asyncapi Format` |
| 🔡 lower case    | lowerCase    | converts a strings to `lower case` (with spaces)  | `asyncapi format` |
| 🔠 UPPER CASE    | upperCase    | converts a strings to `UPPER CASE` (with spaces)  | `ASYNCAPI FORMAT` |

> REMARK: All special characters are stripped during conversion, except for the `@` and `$`.

The casing options are provided by the nano NPM [case-anything](https://github.com/mesqueeb/case-anything) package.

### Format casing - channels

=> **channels**: Refers to the `channels` elements in the AsyncAPI document.

Formatting casing example:

```yaml
channels: snake_case
```

Example before:

```yaml
channels:
  smartylighting.streetlights.lighting.measured:
    description: The topic on which measured values may be produced and consumed.
    subscribe:
      operationId: measuredStreetlight
```

asyncapi-format will format the "measuredStreetlight" from the original dot.notation to snake_case.

Example after:

```yaml
channels:
  smartylighting_streetlights_lighting_measured:
    description: The topic on which measured values may be produced and consumed.
    subscribe:
        operationId: measuredStreetlight
```

### Format casing - operationId

=> **operationId**: Refers to the `operationId` properties in the AsyncAPI document.

Formatting casing example:

```yaml
operationId: kebab-case
```

Example before:

```yaml
channels:
  smartylighting.streetlights.lighting.measured:
    description: The topic on which measured values may be produced and consumed.
    subscribe:
      operationId: measuredStreetlight
```

asyncapi-format will format the "measuredStreetlight" from the original camelcase to kebab-case.

Example after:

```yaml
channels:
  smartylighting.streetlights.lighting.measured:
    description: The topic on which measured values may be produced and consumed.
    subscribe:
      operationId: measured-streetlight
```
### Format casing - model & schema properties

=> **properties**: Refers to all the schema properties, that are defined inline in the channels and the models in the components section of the AsyncAPI document.

Formatting casing example:

```yaml
properties: snake_case
```

Example before:

```yaml
components:
  schemas:
    lightMeasuredPayload:
      type: object
      properties:
        lumensIntensity:
          type: integer
          minimum: 0
          description: Light intensity measured in lumens.
        sentAt:
          $ref: '#/components/schemas/sentAt'
```

The CLI will format all the properties like: "lumens", "sentAt" from the original camelcase to snake_case.

Example after:

```yaml
components:
  schemas:
    lightMeasuredPayload:
      type: object
      properties:
          lumens_intensity:
          type: integer
          minimum: 0
          description: Light intensity measured in lumens.
        sent_at:
          $ref: '#/components/schemas/sentAt'
```

### Format casing - component keys

=> **componentsSchemas / componentsMessages / componentsParameters / componentsMessageTraits / componentsOperationTraits / componentsSecuritySchemes**: Refers to all the model objects that are defined in the components section of the AsyncAPI document.

Formatting casing example:

```yaml
componentsSchemas: PascalCase
```

Example before:

```yaml
channels:
  smartylighting.streetlights.lighting.measured:
    description: The topic on which measured values may be produced and consumed.
    subscribe:
      message:
        $ref: '#/components/messages/turnOnOff'
components:
  messages:
    lightMeasured:
      name: lightMeasured
      title: Light measured
    turnOnOff:
      name: turnOnOff
      title: Turn on/off
    dimLight:
        name: dimLight
        title: Dim light
```

asyncapi-format will format all the component keys like: "lightMeasured", "turnOnOff", "dimLight" to PascalCase, including formatting all the "$ref" used in the AsyncAPI document.

Example after:

```yaml
channels:
  smartylighting.streetlights.lighting.measured:
    description: The topic on which measured values may be produced and consumed.
    subscribe:
      message:
        $ref: '#/components/messages/TurnOnOff'
components:
  messages:
    LightMeasured:
      name: lightMeasured
      title: Light measured
    TurnOnOff:
      name: turnOnOff
      title: Turn on/off
    DimLight:
        name: dimLight
        title: Dim light
```

## CLI sort usage

- Format a spec with the default sorting and saves it as a new JSON file

```shell
$ asyncapi-format asyncapi.json -o asyncapi-formatted.json
```

- Format an AsyncAPI document with the default sorting and saves it as a new YAML file

```shell
$ asyncapi-format asyncapi.yaml -o asyncapi-formatted.yaml
```

- Format an AsyncAPI document with the default sorting and output it as JSON to STDOUT

```shell
$ asyncapi-format asyncapi.json --json
```

- Format an AsyncAPI document with the default sorting and output it as YAML to STDOUT

```shell
$ asyncapi-format asyncapi.json --yaml
```

- Format an AsyncAPI JSON document with the default sorting and save it as YAML

```shell
$ asyncapi-format asyncapi.json -o asyncapi.yaml
```

- Format an AsyncAPI document but skip the sorting and save it as a new JSON file

```shell
$ asyncapi-format asyncapi.json -o asyncapi-formatted.json --no-sort
```

This should keep the AsyncAPI fields in the same order. This can be needed, when you only want to do a filtering or
rename action.

- Format an AsyncAPI document, including sorting all elements in the components section

```shell
$ asyncapi-format asyncapi.json -o asyncapi-formatted.json --sortComponentsFile ./test/json-sort-components/customSortComponents.json
```

This will sort all elements in the components ( components/schemas, components/messages, components/parameters,
components/securitySchemes, ...) section by alphabet.


## CLI filter usage

- Format an AsyncAPI document by filtering fields, default sorting and saves it as a new file

When you want to strip certain flags, tags, operations, operationID's, you can pass a `filterFile` which contains the
specific values for the flags, tags, operations, operationID's.

This can be useful to combine with the sorting, to end-up with an order and filtered AsyncAPI document.

example:

```shell
$ asyncapi-format asyncapi.json -o asyncapi-formatted.json --filterFile customFilter.yaml
```

where the `customFilter.yaml` would contain a combination of all the elements you want to filter out.

```yaml
flags:
    - x-visibility
flagValues: [ ]
tags: [ ]
operationIds:
    - dimLight
    - turnOff
```

## CLI rename usage

- Format a AsyncAPI document by changing the title and saves it as a new JSON file

During CI/CD pipelines, you might want to create different results of the AsyncAPI document. Having the option to rename
them might make it easier to work with the results, so that is why we provide this command option.

```shell
$ asyncapi-format asyncapi.json -o asyncapi.json --rename "Streetlights API - AsyncAPI 2.0"
```

which results in

- before

```json
{
    "asyncapi": "2.0.0",
    "info": {
        "title": "Streetlights API",
```

- after

```json
{
    "asyncapi": "2.0.0",
    "info": {
        "title": "Streetlights API - AsyncAPI 2.0",
```

## CLI configuration usage

All the CLI options can be managed in a separate configuration file and passed along the asyncapi-format command. This
will make configuration easier, especially in CI/CD implementations where the configuration can be stored in version
control systems.

example:

```shell
$ asyncapi-format asyncapi.json --configFile asyncapi-format-options.json
```

The formatting will happen based on all the options set in the `asyncapi-format-options.json` file. All the
available [AsyncAPI format options](https://github.com/thim81/asyncapi-format#asyncapi-format-cli-options) can be used in
the config file.

## OpenAPI documents

For handling OpenAPI documents, we have created a separate 
package [openapi-format](https://github.com/thim81/openapi-format) to allow customisation specific for OpenAPI
use-cases.

## Credits

The filter capabilities from `asyncapi-format` are a light version grounded by the work from [@MikeRalphson](https://github.com/mikeralphson) on
the [openapi-filter](https://github.com/Mermade/openapi-filter) package.

The casing options available in `asyncapi-format` are powered by the excellent [case-anything](https://github.com/mesqueeb/case-anything) nano package from Luca Ban ([@mesqueeb](https://github.com/mesqueeb)).
