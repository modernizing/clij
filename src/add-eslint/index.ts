import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';

import {NodeDependencyType} from 'schematics-utilities';
import {installPackageJsonDependencies} from '../support/npm-support';
import {addDependencies} from '../support/package-json';

function addEsLintDeps() {
  return addDependencies([
    {type: NodeDependencyType.Dev, version: '4.18.2', name: 'eslint',},
    // {type: NodeDependencyType.Dev, version: '4.18.2', name: 'eslint',}
  ]);
}

function addEsLintConfig() {
  return (tree: Tree, _context: SchematicContext) => {
    tree.create('.eslintrc.js', `module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:vue/essential',
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'vue',
  ],
  rules: {
    'no-underscore-dangle': 'off',
  },
};`);
  }
}

export function addEslint(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      addEsLintDeps(),
      addEsLintConfig(),
      installPackageJsonDependencies(),
    ])(tree, context);
  }
}
