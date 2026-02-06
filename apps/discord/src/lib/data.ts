import {
  OuraProvider,
  WhoopProvider,
  getDemoData,
  getRandomDemoData,
  BiometricData,
  ProviderType,
} from "@p360/core";

const providers = {
  oura: new OuraProvider(),
  whoop: new WhoopProvider(),
};

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

export function getProviderDisplayName(provider: ProviderType): string {
  return providers[provider]?.displayName || provider.toUpperCase();
}

export { getDemoData, getRandomDemoData };
