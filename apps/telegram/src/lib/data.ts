import {
  OuraProvider,
  WhoopProvider,
  getDemoData,
  getRandomDemoData,
  BiometricData,
  ProviderType,
} from "@p360/core";

// Provider instances (singleton)
const providers = {
  oura: new OuraProvider(),
  whoop: new WhoopProvider(),
};

/**
 * Fetch biometric data using the specified provider
 */
export async function fetchBiometricData(
  token: string,
  provider: ProviderType = "oura"
): Promise<BiometricData> {
  const providerInstance = providers[provider];
  if (!providerInstance) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return providerInstance.fetchBiometricData(token);
}

/**
 * Validate token for the specified provider
 */
export async function validateToken(
  token: string,
  provider: ProviderType = "oura"
): Promise<boolean> {
  const providerInstance = providers[provider];
  if (!providerInstance) {
    return false;
  }
  return providerInstance.validateToken(token);
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: ProviderType): string {
  return providers[provider]?.displayName || provider.toUpperCase();
}

// Re-export demo functions from core
export { getDemoData, getRandomDemoData };

// Legacy export for backward compatibility
export { fetchBiometricData as fetchOuraBiometricData };
export { validateToken as validateOuraToken };
