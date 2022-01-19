'use strict';

const testUtils = require('./__utils__/test-utils')
const af = require ('./../asyncapi-format')

describe('asyncapi-format CLI casing tests', () => {

    describe('yaml-casing', () => {
        it('yaml-casing - should match expected output', async () => {
            const testName = 'yaml-casing'
            const {result, input, outputBefore, outputAfter} = await testUtils.loadTest(testName)
            // console.log('result',result)
            expect(result.code).toBe(0);
            expect(result.stdout).toContain("formatted successfully");
            expect(outputAfter).toStrictEqual(outputBefore);
        });
    })

    describe('yaml-casing-component-keys', () => {
        it('yaml-casing-component-keys - should match expected output', async () => {
            const testName = 'yaml-casing-component-keys'
            const {result, input, outputBefore, outputAfter} = await testUtils.loadTest(testName)
            // console.log('result',result)
            expect(result.code).toBe(0);
            expect(result.stdout).toContain("formatted successfully");
            expect(outputAfter).toStrictEqual(outputBefore);
        });
    })

    describe('yaml-casing-channel', () => {
        it('yaml-casing-channel - should match expected output', async () => {
            const testName = 'yaml-casing-channel'
            const {result, input, outputBefore, outputAfter} = await testUtils.loadTest(testName)
            // console.log('result',result)
            expect(result.code).toBe(0);
            expect(result.stdout).toContain("formatted successfully");
            expect(outputAfter).toStrictEqual(outputBefore);
        });
    })

    describe('yaml-casing-operationId', () => {
        it('yaml-casing-operationId - should match expected output', async () => {
            const testName = 'yaml-casing-operationId'
            const {result, input, outputBefore, outputAfter} = await testUtils.loadTest(testName)
            // console.log('result',result)
            expect(result.code).toBe(0);
            expect(result.stdout).toContain("formatted successfully");
            expect(outputAfter).toStrictEqual(outputBefore);
        });
    })

    describe('yaml-casing-properties', () => {
        it('yaml-casing-properties - should match expected output', async () => {
            const testName = 'yaml-casing-properties'
            const {result, input, outputBefore, outputAfter} = await testUtils.loadTest(testName)
            // console.log('result',result)
            expect(result.code).toBe(0);
            expect(result.stdout).toContain("formatted successfully");
            expect(outputAfter).toStrictEqual(outputBefore);
        });
    })

    describe('convert casing', () => {
        const str = 'openapi-format'
        it('casing should match camelCase', async () => {
            expect(af.changeCase(str, 'camelCase')).toBe('openapiFormat');
        });
        it('casing should match PascalCase', async () => {
            expect(af.changeCase(str, 'PascalCase')).toBe('OpenapiFormat');
        });
        it('casing should match kebab-case', async () => {
            expect(af.changeCase(str, 'kebab-case')).toBe('openapi-format');
        });
        it('casing should match Train-Case', async () => {
            expect(af.changeCase(str, 'Train-Case')).toBe('Openapi-Format');
        });
        it('casing should match snake_case', async () => {
            expect(af.changeCase(str, 'snake_case')).toBe('openapi_format');
        });
        it('casing should match Ada_Case', async () => {
            expect(af.changeCase(str, 'Ada_Case')).toBe('Openapi_Format');
        });
        it('casing should match CONSTANT_CASE', async () => {
            expect(af.changeCase(str, 'CONSTANT_CASE')).toBe('OPENAPI_FORMAT');
        });
        it('casing should match COBOL-CASE', async () => {
            expect(af.changeCase(str, 'COBOL-CASE')).toBe('OPENAPI-FORMAT');
        });
        it('casing should match Dot.notation', async () => {
            expect(af.changeCase(str, 'Dot.notation')).toBe('openapi.format');
        });
        it('casing should match Space case', async () => {
            expect(af.changeCase(str, 'Space case')).toBe('openapi format');
        });
        it('casing should match Capital Case', async () => {
            expect(af.changeCase(str, 'Capital Case')).toBe('Openapi Format');
        });
        it('casing should match lower case', async () => {
            expect(af.changeCase(str, 'lower case')).toBe('openapi format');
        });
        it('casing should match UPPER CASE', async () => {
            expect(af.changeCase(str, 'UPPER CASE')).toBe('OPENAPI FORMAT');
        });
    });
});
