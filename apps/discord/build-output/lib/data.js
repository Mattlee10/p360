"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomDemoData = exports.getDemoData = void 0;
exports.fetchBiometricData = fetchBiometricData;
exports.validateToken = validateToken;
exports.getProviderDisplayName = getProviderDisplayName;
const core_1 = require("@p360/core");
Object.defineProperty(exports, "getDemoData", { enumerable: true, get: function () { return core_1.getDemoData; } });
Object.defineProperty(exports, "getRandomDemoData", { enumerable: true, get: function () { return core_1.getRandomDemoData; } });
const providers = {
    oura: new core_1.OuraProvider(),
    whoop: new core_1.WhoopProvider(),
};
async function fetchBiometricData(token, provider = "oura") {
    const providerInstance = providers[provider];
    if (!providerInstance) {
        throw new Error(`Unknown provider: ${provider}`);
    }
    return providerInstance.fetchBiometricData(token);
}
async function validateToken(token, provider = "oura") {
    const providerInstance = providers[provider];
    if (!providerInstance) {
        return false;
    }
    return providerInstance.validateToken(token);
}
function getProviderDisplayName(provider) {
    return providers[provider]?.displayName || provider.toUpperCase();
}
