# asyncapi-format

Format an AsyncAPI document by ordering and filtering fields.

The asyncapi-format CLI can load an AsyncAPI file, sorts the AsyncAPI fields by ordering them in a hierarchical order,
and can output the file with clean indenting, to either JSON or YAML.

Next to the ordering, the CLI provides additional options to filter fields & parts of the AsyncAPI document based on
flags, tags, operations and operationID's.

<a href="https://www.npmjs.com/package/asyncapi-format" alt="Latest Stable Version">![npm](https://img.shields.io/npm/v/asyncapi-format.svg)</a>
<a href="https://www.npmjs.com/package/asyncapi-format" alt="Total Downloads">![npm](https://img.shields.io/npm/dw/asyncapi-format.svg)</a>

This `asyncapi-format` CLI is based on [openapi-format](https://github.com/thim81/openapi-format) as a separate
package to allow customisation specific for AsyncAPI use-cases.

## Table of content

* [Use-cases](#use-cases)
* [Features](#features)
* [Installation](#installation)
    + [Local Installation (recommended)](#local-installation--recommended-)
    + [Global Installation](#global-installation)
    + [NPX usage](#npx-usage)
* [Command Line Interface](#command-line-interface)
* [AsyncAPI format options](#asyncapi-format-options)
* [AsyncAPI sort configuration options](#asyncapi-sort-configuration-options)
* [AsyncAPI filter options](#asyncapi-filter-options)
* [CLI sort usage](#cli-sort-usage)
* [CLI filter usage](#cli-filter-usage)
* [CLI rename usage](#cli-rename-usage)
* [CLI configuration usage](#cli-configuration-usage)
* [Credits](#credits)

## Use-cases

When working on large AsyncAPI documents or with multiple team members, the file can be become messy and difficult to
compare changes. By sorting it from time to time, the fields are all ordered in a structured manner, which will help you
to maintain the file with greater ease.

The filtering is a handy add-on to remove specific elements from the AsyncAPI like internal endpoints, beta tags, ...
This can be useful in CI/CD pipelines, where the AsyncAPI is used as source for other documents like Web documentation
or for generating event producers/consumers.

## Features

- [x] Order AsyncAPI fields in a default order
- [x] Order AsyncAPI fields in a custom order
- [x] Filter AsyncAPI files based on operations
- [x] Filter AsyncAPI files based on flags
- [x] Filter AsyncAPI files based on tags
- [x] Filter AsyncAPI files based on operationID's
- [x] Rename the AsyncAPI title
- [x] Support AsyncAPI documents in JSON format
- [x] Support AsyncAPI documents in YAML format
- [x] Format via CLI
- [x] Format via config files
- [x] Use as a Module
- [x] Support for AsyncAPI 2.0

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

  -o, --output     Save the formated AsyncAPI file as JSON/YAML            [path]
  
  --sortFile       The file to specify custom AsyncAPI fields ordering     [path]
  --filterFile     The file to specify filter setting                      [path]
    
  --no-sort        Don't sort the file                                  [boolean]
  --rename         Rename the AsyncAPI title                             [string]

  --configFile     The file with all the format config options            [path]
  
  --json           Prints the file to stdout as JSON                   [boolean]
  --yaml           Prints the file to stdout as YAML                   [boolean]
  
  --help           Show help                                           [boolean]
  --verbose        Output more details of the filter process             [count]
```

## AsyncAPI format options

| Parameter    | Alias         | Description                                                                 | Input type   | Default          | Required/Optional |
|--------------|---------------|-----------------------------------------------------------------------------|--------------|------------------|-------------------|
| file         |               | the original AsyncAPI file                                                  | path to file |                  | required          |
| --output     | -o            | save the formatted AsyncAPI file as JSON/YAML                               | path to file |                  | optional          |
| --sortFile   | -s            | the file to specify custom AsyncAPI fields ordering                         | path to file | defaultSort.json | optional          |
| --filterFile | -f            | the file to specify filter setting                                          | path to file |                  | optional          |
| --no-sort    |               | don't sort the file                                                         | boolean      | FALSE            | optional          |
| --rename     |               | rename the AsyncAPI title                                                   | string       |                  | optional          |
| --configFile | -c            | the file with all the format config options                                 | path to file |                  | optional          |
| --json       |               | prints the file to stdout as JSON                                           |              | FALSE            | optional          |
| --yaml       |               | prints the file to stdout as YAML                                           |              | FALSE            | optional          |
| --verbose    | -v, -vv, -vvv | verbosity that can be increased, which will show more output of the process |              |                  | optional          |
| --help       | h             | display help for command                                                    |              |                  | optional          |

## AsyncAPI sort configuration options

The CLI will sort the AsyncAPI document in the defined order liked defined per AsyncAPI key/element. The fields that are
not specified will keep their order like it is in the original AsyncAPI document, so only defined fields will be
re-ordered.

The default sorting based on the defined order (listed in the table below), which is stored in
the [defaultSort.json](https://github.com/thim81/asyncapi-format/blob/main/defaultSort.json) file.

You can easily modify this by specifying your own ordering per key, which can passed on to the CLI (see below for an
example on how to do this).

| Key         | Ordered by                                                                                                      | AsyncAPI reference                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------| ------------------------------------------------------------------------- |
| root        | - asyncapi<br>\- info<br>\- servers<br>\- channels<br>\- components<br>\- tags<br>\- externalDocs               | https://www.asyncapi.com/docs/specifications/2.0.0#A2SObject              |
| channels    | - description<br>\- parameters<br>\- subscribe<br>\- publish<br>\- bindings                                     | https://www.asyncapi.com/docs/specifications/2.0.0#channelItemObject      |
| parameters  | - name<br>\- in<br>\- description<br>\- required<br>\- schema                                                   | https://www.asyncapi.com/docs/specifications/2.0.0#parametersObject       |
| subscribe   | - operationId<br>\- summary<br>\- description<br>\- message<br>\- traits<br>\- tags                             | https://www.asyncapi.com/docs/specifications/2.0.0#operationObject        |
| publish     | - operationId<br>\- summary<br>\- description<br>\- message<br>\- traits<br>\- tags                             | https://www.asyncapi.com/docs/specifications/2.0.0#operationObject        |
| messages    | - name<br>\- title<br>\- summary<br>\- description<br>\- headers<br>\- payload<br>\- contentType                | https://www.asyncapi.com/docs/specifications/2.0.0#messageObject          |
| payload     | - description<br>\- type<br>\- items<br>\- properties<br>\- format<br>\- example<br>\- default                  | https://www.asyncapi.com/docs/specifications/2.0.0#schemaObject           |
| components  | - parameters<br>\- messages  <br>\- schemas                                                                     | https://www.asyncapi.com/docs/specifications/2.0.0#componentsObject               |
| schema      | - description<br>\- type<br>\- items<br>\- properties<br>\- format<br>\- example<br>\- default                  | https://www.asyncapi.com/docs/specifications/2.0.0#schemaObject           |
| schemas     | - description<br>\- type<br>\- items<br>\- properties<br>\- format<br>\- example<br>\- default                  |                                                                           |
| properties  | - description<br>\- type<br>\- items<br>\- format<br>\- example<br>\- default<br>\- enum                        |                                                                           |

## AsyncAPI filter options

By specifying the desired filter values for the available filter types, the asyncapi-format CLI will strip out any
matching item from the AsyncAPI document. You can combine multiple types to filter out a range of AsyncAPI items.

For more complex use-cases, we can advise the excellent https://github.com/Mermade/openapi-filter package, which has
really extended options for filtering AsyncAPI documents.

| Type         | Description                    | Type  | Examples                         |
|--------------|--------------------------------|-------|----------------------------------|
| operations   | a list AsyncAPI operations.    | array | ['subscribe','publish']          |
| tags         | a list AsyncAPI tags.          | array | ['measure','command']            |
| operationIds | a list AsyncAPI operation ID's.| array | ['turnOff','dimLight']           |
| flags        | a list of custom flags         | array | ['x-exclude','x-internal']       |

Some more details on the available filter types:

- **operations**: Refers to the "Channel Item Object" https://www.asyncapi.com/docs/specifications/2.0.0#channelsObject

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

- **tags**: Refers to the "tags" field from the "Operation
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

- **operationIds**: Refers to the "operationId" field from the "Operation
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

- **flags**: Refers to a custom property which can be set on any field in the AsyncAPI document.

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

## CLI sort usage

- Format a spec with the default sorting and saves it as a new JSON file

```shell
$ asyncapi-format asyncapi.json -o asyncapi-formatted.json
```

- Format a AsyncAPI document with the default sorting and saves it as a new YAML file

```shell
$ asyncapi-format asyncapi.yaml -o asyncapi-formatted.yaml
```

- Format a AsyncAPI document with the default sorting and output it as JSON to STDOUT

```shell
$ asyncapi-format asyncapi.json --json
```

- Format a AsyncAPI document with the default sorting and output it as YAML to STDOUT

```shell
$ asyncapi-format asyncapi.json --yaml
```

- Format a AsyncAPI JSON document with the default sorting and save it as YAML

```shell
$ asyncapi-format asyncapi.json -o asyncapi.yaml
```

- Format a AsyncAPI document but skip the sorting and save it as a new JSON file

example:

```shell
$ asyncapi-format asyncapi.json -o asyncapi-formatted.json --no-sort
```

Which should keep the AsyncAPI fields in the same order. This can be needed, when you only want to do a filtering or
rename action.

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
them, might make it easier to work with the results, so that is why we provide this command option.

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

All the CLI options can be managed in separate configuration file and passed along the asyncapi-format command. This
will make configuration easier, especially in CI/CD implementations where the configuration can be stored in version
control systems.

example:

```shell
$ asyncapi-format asyncapi.json --configFil asyncapi-format-options.json
```

The formatting will happen based on all the options set in the `asyncapi-format-options.json` file. All the
available [AsyncAPI format options](https://github.com/thim81/asyncapi-format#asyncapi-format-options) can be used in
the config file.

## Credits

This package is inspired by
the [@microsoft.azure/format-spec](https://www.npmjs.com/package/@microsoft.azure/format-spec) from @fearthecowboy. The
original code was not available on Github, with the last update was 3 years ago, so to improve support and extend it we
tried to reproduce the original functionality.

The filter capabilities from `asyncapi-format` are a light version inspired by the work from @MikeRalphson on
the https://github.com/Mermade/openapi-filter package.
