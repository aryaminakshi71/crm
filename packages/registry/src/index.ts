/**
 * App Registry
 *
 * Manages platform app catalog and registry for observability.
 */

export { loadRegistryDoc, getAppCatalog, registerApp, unregisterApp } from "./registry";

export type { AppCatalogEntry, AppRegistryDocument } from "./types";
