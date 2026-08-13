const path = require('path');
const { register } = require('tsconfig-paths');

const projectRoot = path.resolve(__dirname, '..');
const runtimeConfig = require(path.join(projectRoot, 'tsconfig.runtime.json'));

register({
  baseUrl: projectRoot,
  paths: runtimeConfig.compilerOptions.paths,
});
