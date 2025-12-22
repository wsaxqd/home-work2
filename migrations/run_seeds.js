#!/usr/bin/env node
/**
 * Database Seed Runner for AI Universal Education Platform
 *
 * Usage:
 *   node run_seeds.js              # Run all base seeds
 *   node run_seeds.js --dev        # Run base + dev seeds
 *   node run_seeds.js --target=plans   # Run only matching file(s)
 *   node run_seeds.js --list       # List all available seed files
 *   node run_seeds.js --dry-run    # Show what would be executed
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Database configuration
const DB_CONFIG = {
  host: "localhost",
  port: "5435",
  user: "admin",
  password: "secure_pass",
  database: "postgres",
  container: "ai_universal_edu",
};

// Seed directories
const SCRIPT_DIR = __dirname;
const SEEDS_DIR = path.join(SCRIPT_DIR, "seeds");
const BASE_DIR = path.join(SEEDS_DIR, "base");
const DEV_DIR = path.join(SEEDS_DIR, "dev");

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = {
    dev: false,
    target: null,
    list: false,
    dryRun: false,
    help: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--dev") {
      args.dev = true;
    } else if (arg.startsWith("--target=")) {
      args.target = arg.split("=")[1];
    } else if (arg === "--list") {
      args.list = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }

  return args;
}

/**
 * Get SQL files from directory, optionally filtered by target
 */
function getSeedFiles(directory, target = null) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  let files = fs
    .readdirSync(directory)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => path.join(directory, f));

  if (target) {
    files = files.filter((f) =>
      path.basename(f).toLowerCase().includes(target.toLowerCase())
    );
  }

  return files;
}

/**
 * Execute a SQL file using docker exec
 */
function executeSqlFile(filePath, dryRun = false) {
  const filename = path.basename(filePath);
  const prefix = dryRun ? "[DRY-RUN] " : "";
  console.log(`${prefix}Executing: ${filename}`);

  if (dryRun) {
    return true;
  }

  try {
    const sqlContent = fs.readFileSync(filePath, "utf-8");

    const cmd = `docker exec -i ${DB_CONFIG.container} psql -U ${DB_CONFIG.user} -d ${DB_CONFIG.database}`;

    const result = execSync(cmd, {
      input: sqlContent,
      encoding: "utf-8",
      env: { ...process.env, PGPASSWORD: DB_CONFIG.password },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Show last few lines of output
    const lines = result.trim().split("\n");
    lines.slice(-3).forEach((line) => {
      if (line.trim()) {
        console.log(`  ${line}`);
      }
    });

    console.log(`  [OK] ${filename}`);
    return true;
  } catch (error) {
    console.log(`  [ERROR] ${error.message}`);
    return false;
  }
}

/**
 * List all available seed files
 */
function listSeeds(includeDev = false, target = null) {
  console.log("\n=== Available Seed Files ===\n");

  console.log("[base/]");
  const baseFiles = getSeedFiles(BASE_DIR, target);
  if (baseFiles.length > 0) {
    baseFiles.forEach((f) => console.log(`  - ${path.basename(f)}`));
  } else {
    console.log("  (no files)");
  }

  if (includeDev || target) {
    console.log("\n[dev/]");
    const devFiles = getSeedFiles(DEV_DIR, target);
    if (devFiles.length > 0) {
      devFiles.forEach((f) => console.log(`  - ${path.basename(f)}`));
    } else {
      console.log("  (no files)");
    }
  }

  console.log();
}

/**
 * Run seed files
 */
function runSeeds(includeDev = false, target = null, dryRun = false) {
  const filesToRun = [];

  // Collect base files
  filesToRun.push(...getSeedFiles(BASE_DIR, target));

  // Collect dev files if requested
  if (includeDev) {
    filesToRun.push(...getSeedFiles(DEV_DIR, target));
  }

  if (filesToRun.length === 0) {
    if (target) {
      console.log(`No seed files matching '${target}' found.`);
    } else {
      console.log("No seed files found.");
    }
    return 1;
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("  Database Seed Runner");
  console.log("=".repeat(50));
  console.log(`  Mode: ${includeDev ? "Development" : "Production (base only)"}`);
  console.log(`  Target: ${target || "all"}`);
  console.log(`  Files: ${filesToRun.length}`);
  if (dryRun) {
    console.log("  ** DRY RUN - No changes will be made **");
  }
  console.log("=".repeat(50) + "\n");

  // Execute files
  let successCount = 0;
  let failCount = 0;

  for (const filePath of filesToRun) {
    if (executeSqlFile(filePath, dryRun)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Print summary
  console.log("\n" + "-".repeat(50));
  console.log(`  Completed: ${successCount} succeeded, ${failCount} failed`);
  console.log("-".repeat(50) + "\n");

  return failCount === 0 ? 0 : 1;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Database Seed Runner for AI Universal Education Platform

Usage:
  node run_seeds.js [options]

Options:
  --dev           Include dev/ seed files (for development environment)
  --target=NAME   Only run seed files matching NAME (e.g., --target=plans)
  --list          List available seed files without executing
  --dry-run       Show what would be executed without making changes
  --help, -h      Show this help message

Examples:
  node run_seeds.js              # Run all base seeds
  node run_seeds.js --dev        # Run base + dev seeds
  node run_seeds.js --target=plans   # Run only files matching 'plans'
  node run_seeds.js --list --dev     # List all seed files
`);
}

// Main
function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return 0;
  }

  if (args.list) {
    listSeeds(args.dev, args.target);
    return 0;
  }

  return runSeeds(args.dev, args.target, args.dryRun);
}

process.exit(main());
