#!/usr/bin/env bun

/**
 * Environment Variable Management Script
 *
 * Manages .env files across the monorepo by creating symlinks from root to all workspaces.
 * Uses Bun native APIs for file operations and Node.js fs for symlink operations.
 *
 * Usage:
 *   bun run scripts/setup-env.ts link      # Create symlinks
 *   bun run scripts/setup-env.ts unlink    # Remove symlinks and restore backups
 *   bun run scripts/setup-env.ts clean     # Delete nested .env.* files from workspaces
 *   bun run scripts/setup-env.ts validate  # Validate env files
 *   bun run scripts/setup-env.ts list      # List env file status
 */

import {
  existsSync,
  lstatSync,
  readdirSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { createInterface } from "node:readline";

const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.staging",
  ".env.development",
  ".env.test",
];

/**
 * Prompt user for yes/no confirmation
 */
async function promptUser(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

/**
 * Get all workspaces from package.json
 */
async function getWorkspaces(): Promise<string[]> {
  const rootPkgPath = resolve(process.cwd(), "package.json");
  const rootPkgFile = Bun.file(rootPkgPath);

  if (!(await rootPkgFile.exists())) {
    throw new Error("package.json not found at root");
  }

  const pkgContent = await rootPkgFile.text();
  const pkg = JSON.parse(pkgContent);

  if (!pkg.workspaces || !Array.isArray(pkg.workspaces)) {
    throw new Error("No workspaces found in package.json");
  }

  const workspaces: string[] = [];

  for (const workspace of pkg.workspaces) {
    if (workspace.includes("*")) {
      // Expand globs like "apps/*" or "packages/*"
      const baseDir = workspace.replace("/*", "");
      const fullPath = resolve(process.cwd(), baseDir);

      try {
        const entries = readdirSync(fullPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            workspaces.push(join(baseDir, entry.name));
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read ${baseDir}:`, error);
      }
    } else {
      workspaces.push(workspace);
    }
  }

  return workspaces;
}

/**
 * Link env files from root to all workspaces
 */
async function linkEnvFiles() {
  const rootDir = process.cwd();
  const workspaces = await getWorkspaces();

  console.log(`Found ${workspaces.length} workspaces\n`);

  for (const envFile of ENV_FILES) {
    const rootEnvPath = resolve(rootDir, envFile);
    const rootFile = Bun.file(rootEnvPath);

    // Check if root .env exists
    if (!(await rootFile.exists())) {
      console.log(`${envFile} not found at root, skipping...`);
      continue;
    }

    console.log(`Processing ${envFile}...`);

    // Link to each workspace
    for (const workspace of workspaces) {
      const workspaceDir = resolve(rootDir, workspace);
      const workspaceEnvPath = join(workspaceDir, envFile);

      // Check if already a symlink
      if (existsSync(workspaceEnvPath)) {
        try {
          const stats = lstatSync(workspaceEnvPath);
          if (stats.isSymbolicLink()) {
            // Check if symlink points to root file
            const linkTarget = readlinkSync(workspaceEnvPath);
            const expectedTarget = relative(workspaceDir, rootEnvPath);

            // Handle both relative and absolute paths
            const linkTargetResolved = resolve(workspaceDir, linkTarget);

            // Check if symlink target exists (broken symlink detection)
            const targetExists = existsSync(linkTargetResolved);
            if (!targetExists) {
              const shouldDelete = await promptUser(
                `Symlink at ${workspace}/${envFile} points to missing file. Delete it?`,
              );
              if (shouldDelete) {
                unlinkSync(workspaceEnvPath);
                console.log(
                  `  Deleted broken symlink at ${workspace}/${envFile}`,
                );
              } else {
                console.log(
                  `  Skipping ${workspace}/${envFile} (broken symlink kept)`,
                );
                continue;
              }
            } else if (
              linkTarget === expectedTarget ||
              linkTargetResolved === rootEnvPath
            ) {
              console.log(`${workspace}/${envFile} already linked correctly`);
              continue;
            } else {
              // Symlink points elsewhere, remove it
              unlinkSync(workspaceEnvPath);
              console.log(
                `  Removed incorrect symlink at ${workspace}/${envFile}`,
              );
            }
          } else {
            // Regular file exists, backup it
            const backupPath = `${workspaceEnvPath}.backup`;
            const existingFile = Bun.file(workspaceEnvPath);
            const existingContent = await existingFile.text();
            await Bun.write(backupPath, existingContent);
            console.log(
              `  Backed up ${workspace}/${envFile} to ${envFile}.backup`,
            );
          }
        } catch (error) {
          console.error(`  Error checking ${workspace}/${envFile}:`, error);
          continue;
        }
      }

      // Create symlink (relative path for portability)
      const relativePath = relative(workspaceDir, rootEnvPath);
      try {
        symlinkSync(relativePath, workspaceEnvPath);
        console.log(`  Linked ${workspace}/${envFile} -> ${relativePath}`);
      } catch (error: any) {
        if (error.code === "EEXIST") {
          console.log(
            `  ${workspace}/${envFile} already exists (not a symlink)`,
          );
        } else {
          console.error(
            `  Failed to link ${workspace}/${envFile}:`,
            error.message,
          );
        }
      }
    }
  }

  console.log("\nLinking complete!");
}

/**
 * Clean nested env files from all workspaces
 */
async function cleanEnvFiles() {
  const rootDir = process.cwd();
  const workspaces = await getWorkspaces();

  // Get all .env.* files that exist at root
  const rootFiles = new Set(
    readdirSync(rootDir)
      .filter((f) => f.startsWith(".env.") && f !== ".env")
      .filter((f) => {
        const filePath = resolve(rootDir, f);
        return existsSync(filePath) && !lstatSync(filePath).isSymbolicLink();
      }),
  );

  console.log(
    `Root .env.* files found: ${rootFiles.size > 0 ? Array.from(rootFiles).join(", ") : "none"}\n`,
  );
  console.log(
    `Scanning ${workspaces.length} workspaces for broken symlinks...\n`,
  );

  let deletedCount = 0;

  for (const workspace of workspaces) {
    const workspaceDir = resolve(rootDir, workspace);

    try {
      const workspaceFiles = readdirSync(workspaceDir).filter(
        (f) => f.startsWith(".env.") && f !== ".env",
      );

      for (const envFile of workspaceFiles) {
        const workspaceEnvPath = join(workspaceDir, envFile);

        let stats;
        try {
          stats = lstatSync(workspaceEnvPath);
        } catch {
          continue;
        }

        try {
          const isSymlink = stats.isSymbolicLink();
          let shouldDelete = false;

          if (isSymlink) {
            const linkTarget = readlinkSync(workspaceEnvPath);
            const linkTargetResolved = resolve(workspaceDir, linkTarget);
            const targetExists = existsSync(linkTargetResolved);

            if (!targetExists) {
              console.log(
                `  Found broken symlink: ${workspace}/${envFile} -> ${linkTarget} (target missing)`,
              );
              shouldDelete = true;
            } else {
              try {
                const targetRelativeToRoot = relative(
                  rootDir,
                  linkTargetResolved,
                );
                if (
                  targetRelativeToRoot.startsWith("..") ||
                  !rootFiles.has(targetRelativeToRoot)
                ) {
                  shouldDelete = true;
                }
              } catch {
                shouldDelete = true;
              }
            }
          } else {
            if (!rootFiles.has(envFile)) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            unlinkSync(workspaceEnvPath);
            const type = isSymlink ? "symlink" : "file";
            console.log(`  Deleted ${type} ${workspace}/${envFile}`);
            deletedCount++;
          }
        } catch (error: any) {
          console.error(
            `  Error checking ${workspace}/${envFile}:`,
            error.message,
          );
        }
      }
    } catch (error: any) {
      console.warn(`  Could not read ${workspace}:`, error.message);
    }
  }

  console.log(
    `\nCleanup complete! Deleted ${deletedCount} file(s)/symlink(s).`,
  );
}

/**
 * Unlink env files and restore backups
 */
async function unlinkEnvFiles() {
  const rootDir = process.cwd();
  const workspaces = await getWorkspaces();

  console.log(`Unlinking env files from ${workspaces.length} workspaces...\n`);

  for (const workspace of workspaces) {
    const workspaceDir = resolve(rootDir, workspace);

    for (const envFile of ENV_FILES) {
      const workspaceEnvPath = join(workspaceDir, envFile);
      const backupPath = `${workspaceEnvPath}.backup`;

      if (existsSync(workspaceEnvPath)) {
        try {
          const stats = lstatSync(workspaceEnvPath);
          if (stats.isSymbolicLink()) {
            unlinkSync(workspaceEnvPath);
            console.log(`Unlinked ${workspace}/${envFile}`);

            // Restore backup if exists
            const backupFile = Bun.file(backupPath);
            if (await backupFile.exists()) {
              const content = await backupFile.text();
              await Bun.write(workspaceEnvPath, content);
              await backupFile.delete();
              console.log(`Restored ${workspace}/${envFile} from backup`);
            }
          } else {
            console.log(
              `  ${workspace}/${envFile} is a regular file (not a symlink), skipping`,
            );
          }
        } catch (error: any) {
          console.error(
            `  Error unlinking ${workspace}/${envFile}:`,
            error.message,
          );
        }
      }
    }
  }

  console.log("\nUnlinking complete!");
}

/**
 * Validate env files against schemas
 */
async function validateEnvFiles() {
  console.log("Validating env files...\n");

  try {
    const { env: serverEnv } = await import("@crm/env/server");

    console.log("Server env schema loaded successfully");
    console.log(
      `   DATABASE_URL: ${serverEnv.DATABASE_URL ? "set" : "not set"}`,
    );
    console.log(
      `   BETTER_AUTH_SECRET: ${serverEnv.BETTER_AUTH_SECRET ? "set" : "not set"}`,
    );
    console.log(
      `   VITE_PUBLIC_SITE_URL: ${serverEnv.VITE_PUBLIC_SITE_URL || "not set"}`,
    );
  } catch (error) {
    console.error("Server env validation failed:", error);
    process.exit(1);
  }

  try {
    const { env: clientEnv } = await import("@crm/env/client");

    console.log("\nClient env schema loaded successfully");
    console.log(
      `   VITE_PUBLIC_SITE_URL: ${clientEnv.VITE_PUBLIC_SITE_URL || "not set"}`,
    );
  } catch (error) {
    console.error("Client env validation failed:", error);
    process.exit(1);
  }

  console.log("\nValidation complete!");
}

/**
 * List status of env files across workspaces
 */
async function listEnvFiles() {
  const rootDir = process.cwd();
  const workspaces = await getWorkspaces();

  console.log("Environment file status across workspaces:\n");

  // Check root first
  console.log("Root:");
  for (const envFile of ENV_FILES) {
    const rootFile = Bun.file(resolve(rootDir, envFile));
    const exists = await rootFile.exists();
    console.log(`  ${exists ? "+" : "-"} ${envFile}`);
  }

  // Check each workspace
  for (const workspace of workspaces) {
    console.log(`\n${workspace}:`);
    const workspaceDir = resolve(rootDir, workspace);

    for (const envFile of ENV_FILES) {
      const workspaceEnvPath = join(workspaceDir, envFile);
      const file = Bun.file(workspaceEnvPath);
      const exists = await file.exists();

      if (exists) {
        try {
          const stats = lstatSync(workspaceEnvPath);
          const type = stats.isSymbolicLink() ? "symlink" : "file";
          console.log(`  ${type} ${envFile}`);

          if (stats.isSymbolicLink()) {
            try {
              const target = readlinkSync(workspaceEnvPath);
              console.log(`      -> ${target}`);
            } catch {
              console.log(`      -> (could not read symlink target)`);
            }
          }
        } catch (error) {
          console.log(`  file ${envFile}`);
        }
      } else {
        console.log(`  - ${envFile} (missing)`);
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || "link";

  switch (command) {
    case "link":
      await linkEnvFiles();
      break;
    case "unlink":
      await unlinkEnvFiles();
      break;
    case "clean":
      await cleanEnvFiles();
      break;
    case "validate":
      await validateEnvFiles();
      break;
    case "list":
      await listEnvFiles();
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(
        "Usage: bun run scripts/setup-env.ts [link|unlink|clean|validate|list]",
      );
      process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
