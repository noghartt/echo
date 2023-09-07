import acorn from 'acorn';
import fs from 'fs';
import path from 'path';

export const createDependencyGraph = (entryFile: string) => {
  const graph = {};

  const dirname = path.dirname(entryFile);

  const { fileImports } = addEntryToGraph(graph, entryFile);

  fileImports.forEach((importedFile) => {
    // TODO: Assume that `.js` is the extension of the filename - fix it
    addEntryToGraph(graph, path.join(dirname, importedFile));
  });

  return graph;
}

const addEntryToGraph = (graph: any, entryFile: string) => {
  const { filename, fileImports, ast, content } = createDependencyGraphImpl(entryFile);

  graph[filename] = {
    fileImports,
    ast,
    content,
  };

  return {
    filename,
    fileImports,
    ast,
    content,
  }
}

const createDependencyGraphImpl = (entryFile: string) => {
  const content = fs.readFileSync(entryFile, 'utf-8');

  const ast = acorn.parse(content, {
    ecmaVersion: 2016,
    sourceType: 'module',
  });

  const importNodes = findNodesByType(ast, 'ImportDeclaration');

  const filename = path.basename(entryFile);

  const fileImports = importNodes.map((node) =>
    // @ts-ignore acorn.Node for ImportDeclaration does not have source defined
    // TODO: Assume that `.js` is the extension of the filename - fix it
    node.source.value + '.js',
  );

  return {
    ast,
    filename,
    fileImports,
    content,
  }
}

const findNodesByType = (ast: acorn.Node, type: string) => {
  const nodes: acorn.Node[] = [];

  const walk = (node: acorn.Node) => {
    if (node.type === type) {
      nodes.push(node);
    }

    for (const key in node) {
      if (node.hasOwnProperty(key)) {
        const child = node[key];
        if (typeof child === 'object' && child !== null) {
          if (Array.isArray(child)) {
            child.forEach((node) => walk(node));
          } else {
            walk(child);
          }
        }
      }
    }
  }

  walk(ast);

  return nodes;
}

console.log(createDependencyGraph(path.join(__dirname, '..', 'examples', 'start', 'index.js')));
