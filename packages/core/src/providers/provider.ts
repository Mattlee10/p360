import { BiometricData } from "../types";

/**
 * BiometricProvider interface
 *
 * All wearable device integrations (Oura, WHOOP, etc.) must implement this interface.
 * This abstraction allows the algorithms to work with any data source.
 */
export interface BiometricProvider {
  /** Provider identifier: "oura" | "whoop" */
  readonly name: string;

  /** Human-readable name: "Oura Ring" | "WHOOP" */
  readonly displayName: string;

  /**
   * Fetch today's biometric data using the provider's API
   * @param token - Access token for the provider's API
   * @returns BiometricData with today's metrics
   */
  fetchBiometricData(token: string): Promise<BiometricData>;

  /**
   * Validate that a token is working
   * @param token - Access token to validate
   * @returns true if valid, false if not
   */
  validateToken(token: string): Promise<boolean>;
}

export type ProviderType = "oura" | "whoop";
