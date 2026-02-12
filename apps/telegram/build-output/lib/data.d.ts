import { getDemoData, getRandomDemoData, BiometricData, ProviderType } from "@p360/core";
/**
 * Fetch biometric data using the specified provider
 */
export declare function fetchBiometricData(token: string, provider?: ProviderType): Promise<BiometricData>;
/**
 * Validate token for the specified provider
 */
export declare function validateToken(token: string, provider?: ProviderType): Promise<boolean>;
/**
 * Get provider display name
 */
export declare function getProviderDisplayName(provider: ProviderType): string;
export { getDemoData, getRandomDemoData };
export { fetchBiometricData as fetchOuraBiometricData };
export { validateToken as validateOuraToken };
