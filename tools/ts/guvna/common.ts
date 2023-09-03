import { join, posix, sep } from "node:path";

/**
 * The root level repository name.
 */
export const ROOT_DIR = "federated-graphql-governance";

/**
 * The top-level directory where subgraphs are stored.
 */
export const SUBGRAPH_DIR = "subgraphs";

/**
 * The top-level directory where supergraphs are stored.
 */
export const SUPERGRAPH_DIR = "supergraphs";

/**
 * The common name by which all graphql schema files will be named (both subgraph and supergraphs).
 */
export const SCHEMA_FILE = "schema.graphql";

/**
 * The common name by which all README files will be named.
 */
export const README_FILE = "README.md";

/**
 * The common name by which all config files will be named.
 */
export const CONFIG_FILE = "config.yml";

/**
 * List of federation types
 */
export const FEDERATION_TYPES = ["Query._entities", "_Any", "_Entity"];

/**
 * An interface that represents the parsed contents of a supergraph config.yml file.
 */
export interface SupergraphConfig {
  metadata: {
    applicationId: string;
  };
  subgraphs: {
    path: string;
    metadata?: {
      applicationId: string;
    };
  }[];
}

/**
 * A class that represents the logical file components of a subgraph declaration.
 */
export class SubgraphGraphDeclaration {
  absolutePath: string;
  relativePath: string;
  relativePosixPath: string;

  // eslint-disable-next-line prettier/prettier
  constructor(
    public domain: string,
    public name: string
  ) {
    this.absolutePath = join(process.cwd(), "subgraphs", domain, name);
    this.relativePath = join("subgraphs", domain, name);
    // Store a posix path as well with forward slashes so the supergraph config file has the
    // same path separators regardless of what OS the composition was run on
    this.relativePosixPath = this.relativePath.split(sep).join(posix.sep);
  }
}

/**
 * A class that represents the logical file components of a supergraph declaration.
 */
export class SupergraphGraphDeclaration {
  absolutePath: string;
  relativePath: string;
  relativePosixPath: string;

  constructor(public name: string) {
    this.absolutePath = join(process.cwd(), "supergraphs", name);
    this.relativePath = join("supergraphs", name);
    this.relativePosixPath = this.relativePath.split(sep).join(posix.sep);
  }
}
