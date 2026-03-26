import fs from "fs";
import path from "path";
import prisma from "@/lib/auth/prisma";

// dotenv.config();
 
// --- Config ------------------------------------------------------------------
 
const DEFAULT_SQL_FILE = path.resolve(
  process.cwd(),
  "prisma/sql/post-migration.sql"
);
 
// --- CLI Args ----------------------------------------------------------------
 
const args = process.argv.slice(2);
const fileArgIndex = args.indexOf("--file");
const isDryRun = args.includes("--dry-run");
 
const sqlFilePath =
  fileArgIndex !== -1 && args[fileArgIndex + 1]
    ? path.resolve(process.cwd(), args[fileArgIndex + 1])
    : DEFAULT_SQL_FILE;
 
// --- Helpers -----------------------------------------------------------------
 
function log(msg: string) {
  console.log(`[migration] ${msg}`);
}
 
function err(msg: string) {
  console.error(`[migration:error] ${msg}`);
}

/**
 * Splits a SQL file into individual executable statements.
 * - Strips single-line comments (--)
 * - Strips block comments (/* ... *\/)
 * - Splits on semicolons
 * - Skips empty statements
 */
function parseSqlStatements(raw: string): string[] {
  const statements: string[] = [];
  let current = "";
  let i = 0;
 
  while (i < raw.length) {
    // -- Block comment: /* ... */
    if (raw[i] === "/" && raw[i + 1] === "*") {
      const end = raw.indexOf("*/", i + 2);
      if (end === -1) {
        // Unterminated block comment — skip to end
        break;
      }
      // Skip the comment entirely (don't add to current)
      i = end + 2;
      continue;
    }
 
    // -- Single-line comment: -- ...
    if (raw[i] === "-" && raw[i + 1] === "-") {
      const end = raw.indexOf("\n", i);
      i = end === -1 ? raw.length : end + 1;
      continue;
    }
 
    // -- Dollar-quoted string: $$...$$ or $tag$...$tag$
    if (raw[i] === "$") {
      // Find the closing $ of the opening tag
      const tagEnd = raw.indexOf("$", i + 1);
      if (tagEnd !== -1) {
        const tag = raw.substring(i, tagEnd + 1); // e.g. "$$" or "$BODY$"
        const closingTag = raw.indexOf(tag, tagEnd + 1);
        if (closingTag !== -1) {
          // Include the full dollar-quoted block as-is
          current += raw.substring(i, closingTag + tag.length);
          i = closingTag + tag.length;
          continue;
        }
      }
    }
 
    // -- Single-quoted string: '...' (with '' escape handling)
    if (raw[i] === "'") {
      let j = i + 1;
      while (j < raw.length) {
        if (raw[j] === "'" && raw[j + 1] === "'") {
          j += 2; // escaped quote ''
        } else if (raw[j] === "'") {
          j++;
          break;
        } else {
          j++;
        }
      }
      current += raw.substring(i, j);
      i = j;
      continue;
    }
 
    // -- Statement terminator
    if (raw[i] === ";") {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = "";
      i++;
      continue;
    }
 
    current += raw[i];
    i++;
  }
 
  // Catch any trailing statement without a semicolon
  const trailing = current.trim();
  if (trailing.length > 0) {
    statements.push(trailing);
  }
 
  return statements;
}
// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Validate SQL file exists
  if (!fs.existsSync(sqlFilePath)) {
    err(`SQL file not found: ${sqlFilePath}`);
    err(
      `Hint: pass a custom path with --file flag, e.g.:\n  npx tsx scripts/run-post-migration.ts --file src/db/migrations/my-file.sql`
    );
    process.exit(1);
  }
 
  log(`Reading SQL file: ${sqlFilePath}`);
  const rawSql = fs.readFileSync(sqlFilePath, "utf-8");
  const statements = parseSqlStatements(rawSql);
 
  if (statements.length === 0) {
    err("No executable SQL statements found in the file.");
    process.exit(1);
  }
 
  log(`Found ${statements.length} statement(s) to execute.`);
 
  if (isDryRun) {
    log("--- DRY RUN MODE - No changes will be made ---");
    statements.forEach((stmt, i) => {
      console.log(`\n[${i + 1}/${statements.length}]\n${stmt};`);
    });
    log("Dry run complete.");
    process.exit(0);
  }

  // 2. Connect to DB
//   const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    log("Connected to database.");

    let successCount = 0;
   

    // 3. Execute each statement inside a transaction
    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i];
          const preview =
            stmt.length > 80 ? stmt.substring(0, 80) + "..." : stmt;
 
          log(`[${i + 1}/${statements.length}] Executing: ${preview}`);
 
          try {
            await tx.$executeRawUnsafe(stmt);
            successCount++;
            log(`[${i + 1}/${statements.length}] Done`);
          } catch (e) {
            err(`[${i + 1}/${statements.length}] Failed: ${preview}`);
            err(`Reason: ${(e as Error).message}`);
            throw e; // rollback entire transaction
          }
        }
      },
      {
        timeout: 60_000, // 60s for Neon serverless cold starts
      }
    );

    log("─────────────────────────────────────────────");
    log(`Migration complete. ${successCount} statement(s) executed successfully.`);
  } catch (e) {
    err("Migration FAILED. All changes have been rolled back.");
    err((e as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    log("Database connection closed.");
  }
}

main();