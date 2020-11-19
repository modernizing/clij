import {SchematicContext, Tree} from "@angular-devkit/schematics";
import {addPackageJsonDependency, getPackageJsonDependency, NodeDependency} from "schematics-utilities";
import {NodePackageInstallTask} from "@angular-devkit/schematics/tasks";

export function addKeyValueToPackageJson(key: string, value: any) {
  return (host: Tree, _context: SchematicContext) => {
    const content: Buffer | null = host.read('./package.json');
    if (content) {
      const pkgJson: any = JSON.parse(content.toString());
      // add jest config for tests
      pkgJson[key] = [value];
      host.overwrite('./package.json', JSON.stringify(pkgJson, null, '\t'));
    }
  }
}

export function addDependencies(dependencies: NodeDependency[]) {
  return (tree: Tree, _context: SchematicContext) => {
    // @ts-ignore
    dependencies.forEach(function (dependency: NodeDependency) {
      addPackageJsonDependency(tree, dependency);
    });
  }
}

export function updateDependencies(dependenciesToUpdate: Record<string, string>, host: Tree, context: SchematicContext) {
  let hasChanges = false;
  for (const [name, version] of Object.entries(dependenciesToUpdate)) {
    const current = getPackageJsonDependency(host, name);
    if (!current || current.version === version) {
      continue;
    }

    addPackageJsonDependency(host, {
      type: current.type,
      name,
      version,
      overwrite: true,
    });

    hasChanges = true;
  }

  if (hasChanges) {
    context.addTask(new NodePackageInstallTask());
  }
}
