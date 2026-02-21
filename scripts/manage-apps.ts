#!/usr/bin/env bun

/**
 * Multi-App Management CLI
 * Manage credentials and configurations for 20+ production apps
 *
 * Usage:
 *   bun run scripts/manage-apps.ts init                    # Initialize empty registry
 *   bun run scripts/manage-apps.ts add <id> <name> <domain> [env]  # Add an app
 *   bun run scripts/manage-apps.ts remove <id> [env]       # Remove an app
 *   bun run scripts/manage-apps.ts list [env]              # List all apps
 *   bun run scripts/manage-apps.ts show <id> [env]         # Show app details
 *   bun run scripts/manage-apps.ts generate <id> [env]     # Generate .env file
 *   bun run scripts/manage-apps.ts generate-all            # Generate all .env files
 *   bun run scripts/manage-apps.ts validate [id]           # Validate configurations
 *   bun run scripts/manage-apps.ts export [format]         # Export to CSV/JSON
 *   bun run scripts/manage-apps.ts template <id> <domain>  # Generate minimal template
 *   bun run scripts/manage-apps.ts stats                   # Show registry statistics
 *   bun run scripts/manage-apps.ts checklist <id> [env]    # Show setup checklist
 *   bun run scripts/manage-apps.ts costs                   # Show cost estimate
 *   bun run scripts/manage-apps.ts batch-add               # Batch add apps from stdin
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import {
  SERVICE_PROVIDERS,
  addApp,
  batchAddApps,
  createEmptyRegistry,
  exportToCSV,
  exportToCSVFull,
  exportToJSON,
  generateAllEnvFiles,
  generateCostEstimate,
  generateEnvFile,
  generateMinimalTemplate,
  generateSetupChecklist,
  generateSummaryTable,
  getApp,
  getRegistryStats,
  listApps,
  loadRegistry,
  printValidationResults,
  removeApp,
  saveRegistry,
  validateAppConfig,
  validateProductionReadiness,
  validateRegistry,
} from "./multi-app";
import type { Environment } from "./multi-app/types";

const HELP_TEXT = `
Multi-App Credentials Management CLI
====================================

Commands:
  init                              Initialize empty registry
  add <id> <name> <domain> [env]    Add an app (env: development|staging|production)
  remove <id> [env]                 Remove an app (all envs if env not specified)
  list [env]                        List all apps (optionally filter by environment)
  show <id> [env]                   Show app details
  generate <id> [env]               Generate .env file for an app
  generate-all                      Generate .env files for all apps
  validate [id]                     Validate configurations
  export [format]                   Export to CSV (default) or JSON
  export-full [format]              Export with unmasked secrets
  template <id> <domain>            Generate minimal .env template
  stats                             Show registry statistics
  checklist <id> [env]              Show setup checklist for an app
  costs                             Show cost estimation
  batch-add                         Batch add apps from JSON input
  services                          Show service provider info

Options:
  --help, -h                        Show this help message
  --env, -e <environment>           Specify environment

Examples:
  bun run scripts/manage-apps.ts init
  bun run scripts/manage-apps.ts add app-1 "My App" myapp.com production
  bun run scripts/manage-apps.ts list production
  bun run scripts/manage-apps.ts generate app-1 production
  bun run scripts/manage-apps.ts validate
  bun run scripts/manage-apps.ts export csv
`;

/**
 * Parse command line arguments
 */
function parseArgs(): {
  command: string;
  args: string[];
  options: Record<string, string | boolean>;
} {
  const rawArgs = process.argv.slice(2);
  const args: string[] = [];
  const options: Record<string, string | boolean> = {};

  let i = 0;
  while (i < rawArgs.length) {
    const arg = rawArgs[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = rawArgs[i + 1];

      if (nextArg && !nextArg.startsWith("-")) {
        options[key] = nextArg;
        i += 2;
      } else {
        options[key] = true;
        i++;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      const nextArg = rawArgs[i + 1];

      // Map short options to long ones
      const shortMap: Record<string, string> = {
        h: "help",
        e: "env",
        f: "full",
      };

      const longKey = shortMap[key] || key;

      if (nextArg && !nextArg.startsWith("-")) {
        options[longKey] = nextArg;
        i += 2;
      } else {
        options[longKey] = true;
        i++;
      }
    } else {
      args.push(arg);
      i++;
    }
  }

  return {
    command: args[0] || "help",
    args: args.slice(1),
    options,
  };
}

/**
 * Read JSON from stdin
 */
async function readStdin(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const lines: string[] = [];

  for await (const line of rl) {
    lines.push(line);
  }

  return lines.join("\n");
}

/**
 * Main CLI handler
 */
async function main() {
  const { command, args, options } = parseArgs();

  if (options.help || command === "help") {
    console.log(HELP_TEXT);
    return;
  }

  const registry = loadRegistry();

  switch (command) {
    case "init": {
      const newRegistry = createEmptyRegistry();
      saveRegistry(newRegistry);
      console.log("Initialized empty app registry.");
      console.log("Next: Use 'add' command to add apps.");
      break;
    }

    case "add": {
      const [id, name, domain, envArg] = args;

      if (!id || !name || !domain) {
        console.error("Usage: add <id> <name> <domain> [environment]");
        console.error("Example: add app-1 'My App' myapp.com production");
        process.exit(1);
      }

      const env = (envArg || "production") as Environment;

      if (!["development", "staging", "production"].includes(env)) {
        console.error(
          "Environment must be: development, staging, or production",
        );
        process.exit(1);
      }

      try {
        const app = addApp(registry, id, name, domain, env);
        saveRegistry(registry);
        console.log(`Added app: ${app.name} (${app.environment})`);
        console.log(`Domain: ${app.domain}`);
        console.log(`\nNext steps:`);
        console.log(`  1. Configure services in app-registry.json`);
        console.log(
          `  2. Run: bun run scripts/manage-apps.ts generate ${id} ${env}`,
        );
      } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
      }
      break;
    }

    case "remove": {
      const [id, envArg] = args;

      if (!id) {
        console.error("Usage: remove <id> [environment]");
        process.exit(1);
      }

      const env = envArg as Environment | undefined;
      const removed = removeApp(registry, id, env);

      if (removed) {
        saveRegistry(registry);
        console.log(
          `Removed app: ${id}${env ? ` (${env})` : " (all environments)"}`,
        );
      } else {
        console.error(`App not found: ${id}`);
        process.exit(1);
      }
      break;
    }

    case "list": {
      const [envArg] = args;
      const env = envArg as Environment | undefined;
      const apps = listApps(registry, env);

      if (apps.length === 0) {
        console.log("No apps registered.");
        console.log("Use 'add' command to add an app.");
        return;
      }

      console.log(generateSummaryTable(registry));
      console.log(`\nTotal: ${apps.length} apps`);
      break;
    }

    case "show": {
      const [id, envArg] = args;

      if (!id) {
        console.error("Usage: show <id> [environment]");
        process.exit(1);
      }

      const env = envArg as Environment | undefined;
      const app = getApp(registry, id, env);

      if (!app) {
        console.error(`App not found: ${id}`);
        process.exit(1);
      }

      console.log(JSON.stringify(app, null, 2));
      break;
    }

    case "generate": {
      const [id, envArg] = args;

      if (!id) {
        console.error("Usage: generate <id> [environment]");
        process.exit(1);
      }

      const env = envArg as Environment | undefined;
      const app = getApp(registry, id, env);

      if (!app) {
        console.error(`App not found: ${id}`);
        process.exit(1);
      }

      generateEnvFile(app);
      break;
    }

    case "generate-all": {
      const paths = generateAllEnvFiles(registry);
      console.log(`\nGenerated ${paths.length} .env files.`);
      break;
    }

    case "validate": {
      const [id] = args;

      if (id) {
        const app = getApp(registry, id);
        if (!app) {
          console.error(`App not found: ${id}`);
          process.exit(1);
        }

        const result = validateAppConfig(app);
        printValidationResults([result]);
      } else {
        const results = validateRegistry(registry);
        printValidationResults(results);

        // Also check production readiness
        const { ready, issues } = validateProductionReadiness(registry);
        console.log("\nProduction Readiness:");
        if (ready) {
          console.log("✓ All production apps are properly configured");
        } else {
          console.log("✗ Some production apps have issues:");
          for (const issue of issues) {
            console.log(`  - ${issue}`);
          }
        }
      }
      break;
    }

    case "export": {
      const [format = "csv"] = args;
      const full = options.full === true;

      if (format === "csv") {
        if (full) {
          exportToCSVFull(registry);
        } else {
          exportToCSV(registry);
        }
      } else if (format === "json") {
        exportToJSON(registry, undefined, !full);
      } else {
        console.error("Format must be: csv or json");
        process.exit(1);
      }
      break;
    }

    case "export-full": {
      const [format = "csv"] = args;

      if (format === "csv") {
        exportToCSVFull(registry);
      } else if (format === "json") {
        exportToJSON(registry, undefined, false);
      } else {
        console.error("Format must be: csv or json");
        process.exit(1);
      }
      break;
    }

    case "template": {
      const [id, domain] = args;

      if (!id || !domain) {
        console.error("Usage: template <id> <domain>");
        process.exit(1);
      }

      const template = generateMinimalTemplate(id, domain);
      const outputPath = resolve(
        process.cwd(),
        "generated-envs",
        `${id}-template.env`,
      );

      // Ensure directory exists
      const { mkdirSync, existsSync } = await import("node:fs");
      const { dirname } = await import("node:path");
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(outputPath, template, "utf-8");
      console.log(`Generated template: ${outputPath}`);
      break;
    }

    case "stats": {
      const stats = getRegistryStats(registry);

      console.log("Registry Statistics");
      console.log("=".repeat(40));
      console.log(`Total Apps: ${stats.totalApps}`);
      console.log("");
      console.log("By Environment:");
      console.log(`  Development: ${stats.byEnvironment.development}`);
      console.log(`  Staging: ${stats.byEnvironment.staging}`);
      console.log(`  Production: ${stats.byEnvironment.production}`);
      console.log("");
      console.log("Services Configured:");
      for (const [service, count] of Object.entries(stats.servicesConfigured)) {
        console.log(`  ${service}: ${count}/${stats.totalApps}`);
      }
      break;
    }

    case "checklist": {
      const [id, envArg] = args;

      if (!id) {
        console.error("Usage: checklist <id> [environment]");
        process.exit(1);
      }

      const env = envArg as Environment | undefined;
      const app = getApp(registry, id, env);

      if (!app) {
        console.error(`App not found: ${id}`);
        process.exit(1);
      }

      console.log(generateSetupChecklist(app));
      break;
    }

    case "costs": {
      console.log(generateCostEstimate(registry));
      break;
    }

    case "batch-add": {
      console.log("Enter JSON array of apps (Ctrl+D to finish):");
      console.log(
        'Format: [{"id": "app-1", "name": "My App", "domain": "myapp.com", "environments": ["production"]}]',
      );

      try {
        const input = await readStdin();
        const apps = JSON.parse(input);

        if (!Array.isArray(apps)) {
          console.error("Input must be a JSON array");
          process.exit(1);
        }

        const added = batchAddApps(registry, apps);
        saveRegistry(registry);

        console.log(`\nAdded ${added.length} apps.`);
        for (const app of added) {
          console.log(`  - ${app.name} (${app.environment})`);
        }
      } catch (error) {
        console.error(`Error parsing JSON: ${error}`);
        process.exit(1);
      }
      break;
    }

    case "services": {
      console.log("Service Provider Information");
      console.log("=".repeat(50));

      for (const [key, info] of Object.entries(SERVICE_PROVIDERS)) {
        console.log(`\n${info.name}:`);
        console.log(`  Console: ${info.consoleUrl}`);
        console.log(`  Free Tier: ${info.freeLimit}`);
        console.log(`  Cost: ${info.costInfo}`);
      }
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      console.log("\nUse --help to see available commands.");
      process.exit(1);
    }
  }
}

// Run the CLI
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
