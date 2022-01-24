## unreleased

## [1.1.0] - 2022-01-24

- Formatting - Change casing of AsyncAPI elements
- Formatting - Sort components objects alphabetically
- Filtering - Inverse filtering for operationIds via `inverseOperationIds`
- Filtering - Inverse filtering for tags via `inverseTags`
- Filtering - Inverse filtering for methods via `inverseOperations`
- Filtering - Replace words/characters in description, summary, URL fields with new value
- Filtering - Removal of "unused" components
- Filtering - Removal by flag values
- Filtering - Strip flags from result
- Improved asyncapi-format CLI output
- Extended documentation
- Extended CLI tests
- Switched from Mocha testing framework to Jest
- Bumped dependencies
- Added asyncapi-format logo

## [1.0.2] - 2021-03-16

- Corrected typo's

## [1.0.1] - 2021-04-03

- Corrected bin command

## [1.0.0] - 2021-04-03

Initial release

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
