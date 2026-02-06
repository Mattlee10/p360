// Legacy wrapper for backward compatibility
// New code should use data.ts directly

export {
  fetchBiometricData,
  validateToken as validateOuraToken,
  getDemoData,
  getRandomDemoData,
} from "./data";
