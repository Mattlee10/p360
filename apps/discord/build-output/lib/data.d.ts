import { getDemoData, getRandomDemoData, BiometricData, ProviderType } from "@p360/core";
export declare function fetchBiometricData(token: string, provider?: ProviderType): Promise<BiometricData>;
export declare function validateToken(token: string, provider?: ProviderType): Promise<boolean>;
export declare function getProviderDisplayName(provider: ProviderType): string;
export { getDemoData, getRandomDemoData };
