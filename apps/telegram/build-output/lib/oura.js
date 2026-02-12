"use strict";
// Legacy wrapper for backward compatibility
// New code should use data.ts directly
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomDemoData = exports.getDemoData = exports.validateOuraToken = exports.fetchBiometricData = void 0;
var data_1 = require("./data");
Object.defineProperty(exports, "fetchBiometricData", { enumerable: true, get: function () { return data_1.fetchBiometricData; } });
Object.defineProperty(exports, "validateOuraToken", { enumerable: true, get: function () { return data_1.validateToken; } });
Object.defineProperty(exports, "getDemoData", { enumerable: true, get: function () { return data_1.getDemoData; } });
Object.defineProperty(exports, "getRandomDemoData", { enumerable: true, get: function () { return data_1.getRandomDemoData; } });
