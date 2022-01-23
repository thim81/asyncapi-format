const fs = require("fs");
const jy = require('js-yaml');
const {exec} = require("child_process");
const path = require("path");

async function loadTest(folder, inputType = 'yaml', outType = 'yaml') {
  let input, outputBefore, outputAfter = {}
  const testPath = `./test/${folder}`
  const inputFile = `input.${inputType}`
  const inputPath = `./test/${folder}/${inputFile}`
  const outputFile = `output.${outType}`
  const outputPath = `./test/${folder}/${outputFile}`

  try {
    if (outType === 'json') {
      input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    } else {
      input = jy.load(fs.readFileSync(inputPath, 'utf8'));
    }
  } catch (err) {
    // File not found = {} will be used
  }

  try {
    if (outType === 'json') {
      outputBefore = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } else {
      outputBefore = jy.load(fs.readFileSync(outputPath, 'utf8'));
    }
  } catch (err) {
    // File not found = {} will be used
  }

  let result = await cli([`${inputFile}`, `--configFile options.yaml`], testPath);

  try {
    if (outType === 'json') {
      outputAfter = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    } else {
      outputAfter = jy.load(fs.readFileSync(outputPath, 'utf8'));
    }
  } catch (err) {
    //
  }

  return {result: result, input: input, outputBefore: outputBefore, outputAfter: outputAfter}
}

function cli(args, cwd) {
  return new Promise(resolve => {
    exec(
      `node ${path.resolve("./bin/cli")} ${args.join(" ")}`,
      {cwd},
      (error, stderr, stdout,) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr
        });
      }
    );
  });
}

module.exports = {
  loadTest: loadTest,
  cli: cli
};
