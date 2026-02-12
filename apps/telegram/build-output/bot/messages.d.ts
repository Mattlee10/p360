import type { ProviderType } from "@p360/core";
export declare const MESSAGES: {
    welcome: string;
    help: string;
    connectInstructions: string;
    connectSuccess: (provider?: ProviderType) => string;
    connectFailed: (provider?: ProviderType) => string;
    disconnected: string;
    notConnected: string;
    fetchError: string;
    status: (connected: boolean, lastCheck?: Date, provider?: ProviderType) => string;
};
