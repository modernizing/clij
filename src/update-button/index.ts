import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {updateDependencies} from "../support/package-json";
// import {InsertChange, insertImport, NoopChange} from "schematics-utilities";


// You don't have to export the function as default. You can also have more than one rule factory
function updateDeps(host: Tree, context: SchematicContext) {
  const dependenciesToUpdate: Record<string, string> = {
    'webpack': '^4.15.0',
  }

  updateDependencies(dependenciesToUpdate, host, context);
}

// per file.
export function updateButton(_options: any): Rule {
  return (host: Tree, context: SchematicContext) => {
    updateDeps(host, context);
    return host;
  };
}

// export function addImportStatement(tree: Tree, filePath: string, type: string, file: string): void {
//   let source = getTsSourceFile(tree, filePath);
//   const importChange = insertImport(source, filePath, type, file) as InsertChange;
//   if (!(importChange instanceof NoopChange)) {
//     const recorder = tree.beginUpdate(filePath);
//     recorder.insertLeft(importChange.pos, importChange.toAdd);
//     tree.commitUpdate(recorder);
//   }
// }
