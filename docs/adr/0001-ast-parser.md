# 1. AST parser

Date: 2020-11-30

## Status

2020-11-30 proposed

## Context

### SCSS Modify: scss-parser + query-ast

 - [query-ast](https://github.com/salesforce-ux/query-ast)  A library to traverse/modify an AST.
 - [scss-parser](https://github.com/salesforce-ux/scss-parser)  A library to parse/stringify SCSS.

```typescript
import { Tree } from '@angular-devkit/schematics';
import { parse, stringify } from 'scss-parser';

export function modifyStylesSCSS(host: Tree, fileName: string) {
  const fileContent: Buffer | null = host.read(fileName);
  if (fileContent) {
    let ast = parse(fileContent.toString());
    let createQueryWrapper = require('query-ast');
    let $ = createQueryWrapper(ast);
    const content = `
      @import './scss/bootstrap';
      
      //gms-font
      * {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
        'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
      }
      
      `;

    if ($('atrule').length() > 0) {
      $('atrule')
        .last()
        .after(parse(content));
    } else {
      $()
        .children()
        .first()
        .before(parse(content));
    }

    host.overwrite(fileName, stringify($().get(0)));
  }
}
```

### [TSQuery](https://github.com/phenomnomnominal/tsquery)

TSQuery is a port of the ESQuery API for TypeScript! TSQuery allows you to query a TypeScript AST for patterns of syntax using a CSS style selector system.


```typescript
import { tsquery } from '@phenomnomnominal/tsquery';

const typescript = `

class Animal {
    constructor(public name: string) { }
    move(distanceInMeters: number = 0) {
        console.log(\`\${this.name} moved \${distanceInMeters}m.\`);
    }
}

class Snake extends Animal {
    constructor(name: string) { super(name); }
    move(distanceInMeters = 5) {
        console.log("Slithering...");
        super.move(distanceInMeters);
    }
}

`;

const ast = tsquery.ast(typescript);
const nodes = tsquery(ast, 'Identifier[name="Animal"]');
console.log(nodes.length); // 2
```


Usage: [Angular Divolte](https://github.com/gmsca/ngdivolte/blob/ddb7ae88975aa64a0f5bd9d7e40994dd49dbe4c2/src/ng-add/utility/ast-utils.ts)

Use Demo: 

```typescript
export function doAddImportToModule(
  host: Tree,
  modulePath: string,
  moduleName: string,
  src: string
) {
  const moduleSource = getSourceFile(host, modulePath);

  if (!moduleSource) {
    throw new SchematicsException(`Module not found: ${modulePath}`);
  }

  const change = addImportToModule(moduleSource, modulePath, moduleName, src);
  const recorder = host.beginUpdate(modulePath);
  change.forEach(item => {
    if (item instanceof InsertChange) {
      recorder.insertLeft(item.pos, item.toAdd);
    }
  });

  host.commitUpdate(recorder);
}

export function InsertCodeToTsFile(
  host: Tree,
  ComponentPath: string,
  content: string
) {
  const recorder = host.beginUpdate(ComponentPath);

  if (
    tsquery(
      readIntoSourceFile(host, ComponentPath),
      'Identifier[name="enableClickstream"]'
    ).length == 0
  ) {
    let insertPos =
      tsquery(
        readIntoSourceFile(host, ComponentPath),
        'IfStatement:has(Identifier[name="enableProdMode"]) > Block'
      )[0].end - 1;
    let change = new InsertChange(ComponentPath, insertPos, content);

    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }

    host.commitUpdate(recorder);
  }
}
```


### TypeScript

Source: [https://github.com/Salah856/PWA/blob/master/dialog-master/schematics/src/ng-add/index.ts](https://github.com/Salah856/PWA/blob/master/dialog-master/schematics/src/ng-add/index.ts)

#### InsertImport

```typescript
function getTsSourceFile(host: Tree, path: string): ts.SourceFile {
  const buffer = host.read(path);
  if (!buffer) {
    throw new SchematicsException(`Could not read file (${path}).`);
  }
  const content = buffer.toString();
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);

  return source;
}

function injectImports(options: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, Object.keys(workspace.projects)[0]);
    const modulePath = getAppModulePath(host, (project as any).architect.build.options.main);

    const moduleSource = getTsSourceFile(host, modulePath);

    const change = insertImport(moduleSource, modulePath, 'DialogModule', '@ngneat/dialog');

    if (change) {
      const recorder = host.beginUpdate(modulePath);
      recorder.insertLeft((change as InsertChange).pos, (change as InsertChange).toAdd);
      host.commitUpdate(recorder);
    }

    return host;
  };
}
```


#### InsertExport

Source: [https://github.com/stcoder/ng-schematics/blob/master/src/utils/index.ts](https://github.com/stcoder/ng-schematics/blob/master/src/utils/index.ts)

Code:

```typescript
export function insertExport(
  source: ts.SourceFile,
  fileToEdit: string,
  symbolName: string | undefined,
  fileName: string
): Change {
  const rootNode = source;
  const allExports = findNodes(rootNode, ts.SyntaxKind.ExportDeclaration);

  // получаем все export узлы
  const relevantExports = allExports.filter(node => {
    // собираем экспортированные файлы
    const exportFiles = node
      .getChildren()
      .filter(child => child.kind === ts.SyntaxKind.StringLiteral)
      .map(n => (n as ts.StringLiteral).text);

    // проверяем, подключен ли fileName
    return exportFiles.some(file => file === fileName);
  });

  // если fileName уже подключен
  if (relevantExports.length > 0) {
    let exportsAsterisk: boolean = false;
    // массив экспортов из файла
    const exports: ts.Node[] = [];
    relevantExports.forEach(node => {
      // ищем все экспортированные идентификаторы из файла и добавляем в массив
      exports.push(...findNodes(node, ts.SyntaxKind.Identifier));

      // ищем звездочку
      if (findNodes(node, ts.SyntaxKind.AsteriskToken).length > 0) {
        exportsAsterisk = true;
      }
    });

    // если export * fileName, ничего не делаем
    if (exportsAsterisk) {
      return new NoopChange();
    }

    // ищем symbolName среди экспортированных идентификаторов
    const exportTextNodes = exports.filter(node => (node as ts.Identifier).text === symbolName);

    // не нашли symbolName
    if (exportTextNodes.length === 0) {
      const fallbackPos =
        findNodes(relevantExports[0], ts.SyntaxKind.CloseBraceToken)[0].getStart() ||
        findNodes(relevantExports[0], ts.SyntaxKind.FromKeyword)[0].getStart();

      return insertAfterLastOccurrence(exports, `, ${symbolName}`, fileToEdit, fallbackPos);
    }

    return new NoopChange();
  }

  const open = symbolName === void 0 ? '' : '{ ';
  const close = symbolName === void 0 ? '' : ' }';
  symbolName = symbolName === void 0 ? '*' : symbolName;

  const insertAtBeginning = allExports.length === 0;
  const separator = insertAtBeginning ? '' : ';\n';
  const toInsert = `${separator}export ${open}${symbolName}${close} from '${fileName}'`;

  return insertAfterLastOccurrence(allExports, toInsert, fileToEdit, 0, ts.SyntaxKind.StringLiteral);
}
```

## Decision

Decision here...

## Consequences

Consequences here...
