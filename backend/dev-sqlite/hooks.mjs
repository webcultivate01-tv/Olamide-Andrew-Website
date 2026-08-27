import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// Redirects every `import ... from "config/db.js"` to the SQLite stand-in next
// to this file, so the app can be started on a machine with no MySQL. Nothing
// in the app is changed or aware of it - config/db.js stays the real MySQL
// pool for every normal run.
//
// Used as:  node --import ./dev-sqlite/hooks.mjs server.js

const here = path.dirname(fileURLToPath(import.meta.url));
const mysqlPool = pathToFileURL(path.join(here, "..", "config", "db.js")).href;
const sqlitePool = pathToFileURL(path.join(here, "sqlite-db.js")).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    const resolved = nextResolve(specifier, context);

    if (resolved.url === mysqlPool) {
      return { ...resolved, url: sqlitePool, shortCircuit: true };
    }

    return resolved;
  },
});

console.log("[sqlite] MySQL stand-in active - data goes to backend/dev-sqlite/dev.db");
