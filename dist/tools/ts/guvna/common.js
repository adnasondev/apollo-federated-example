"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupergraphGraphDeclaration = exports.SubgraphGraphDeclaration = exports.FEDERATION_TYPES = exports.CONFIG_FILE = exports.README_FILE = exports.SCHEMA_FILE = exports.SUPERGRAPH_DIR = exports.SUBGRAPH_DIR = exports.ROOT_DIR = void 0;
const node_path_1 = require("node:path");
/**
 * The root level repository name.
 */
exports.ROOT_DIR = "federated-graphql-governance";
/**
 * The top-level directory where subgraphs are stored.
 */
exports.SUBGRAPH_DIR = "subgraphs";
/**
 * The top-level directory where supergraphs are stored.
 */
exports.SUPERGRAPH_DIR = "supergraphs";
/**
 * The common name by which all graphql schema files will be named (both subgraph and supergraphs).
 */
exports.SCHEMA_FILE = "schema.graphql";
/**
 * The common name by which all README files will be named.
 */
exports.README_FILE = "README.md";
/**
 * The common name by which all config files will be named.
 */
exports.CONFIG_FILE = "config.yml";
/**
 * List of federation types
 */
exports.FEDERATION_TYPES = ["Query._entities", "_Any", "_Entity"];
/**
 * A class that represents the logical file components of a subgraph declaration.
 */
class SubgraphGraphDeclaration {
    // eslint-disable-next-line prettier/prettier
    constructor(domain, name) {
        this.domain = domain;
        this.name = name;
        this.absolutePath = (0, node_path_1.join)(process.cwd(), "subgraphs", domain, name);
        this.relativePath = (0, node_path_1.join)("subgraphs", domain, name);
        // Store a posix path as well with forward slashes so the supergraph config file has the
        // same path separators regardless of what OS the composition was run on
        this.relativePosixPath = this.relativePath.split(node_path_1.sep).join(node_path_1.posix.sep);
    }
}
exports.SubgraphGraphDeclaration = SubgraphGraphDeclaration;
/**
 * A class that represents the logical file components of a supergraph declaration.
 */
class SupergraphGraphDeclaration {
    constructor(name) {
        this.name = name;
        this.absolutePath = (0, node_path_1.join)(process.cwd(), "supergraphs", name);
        this.relativePath = (0, node_path_1.join)("supergraphs", name);
        this.relativePosixPath = this.relativePath.split(node_path_1.sep).join(node_path_1.posix.sep);
    }
}
exports.SupergraphGraphDeclaration = SupergraphGraphDeclaration;
//# sourceMappingURL=common.js.map