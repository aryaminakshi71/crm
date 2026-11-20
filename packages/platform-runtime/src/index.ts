/**
 * Platform Runtime
 *
 * Core runtime primitives for platform reliability:
 * - API fetch with retry logic
 * - AI runtime reliability patterns
 * - In-memory telemetry
 */

export { createPlatformFetch } from "./api";
export { createAiRuntime } from "./ai";
export { createTelemetry, type TelemetryEvent } from "./telemetry";
