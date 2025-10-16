import {dirname} from "node:path";
import {fileURLToPath} from "node:url";

export const remixRuntimeDirectory = dirname(fileURLToPath(import.meta.url))