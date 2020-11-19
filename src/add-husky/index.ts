import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {addDependencies, addKeyValueToPackageJson} from '../support/package-json';
import {NodeDependencyType} from 'schematics-utilities';
import {installPackageJsonDependencies} from "../support/npm-support";


function addHuskyDeps() {
  return addDependencies([
    {
      type: NodeDependencyType.Dev, version: '^3.0.0', name: 'husky',
    }, {
      type: NodeDependencyType.Dev, version: '^9.2.0', name: 'lint-staged',
    }
  ]);
}

function addHuskyConfig() {
  return addKeyValueToPackageJson("husky", {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  });
}

function addLintStagedConfig() {
  return addKeyValueToPackageJson("lint-staged", {
    "*.{js,ts,vue}": [
      "eslint --format=codeframe --fix",
      "git add"
    ]
  });
}

export function addHusky(_options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      addHuskyDeps(),
      addHuskyConfig(),
      addLintStagedConfig(),
      installPackageJsonDependencies(),
    ])(tree, context);
  }
}
