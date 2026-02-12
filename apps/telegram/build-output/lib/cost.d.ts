export { getRecoveryCost, parseSubstance, getSubstanceList, getSubstanceCategory, } from "@p360/core";
export type { SubstanceType, SubstanceCategory, DayCost, RecoveryCost, } from "@p360/core";
import type { RecoveryCost } from "@p360/core";
export declare function formatCostTelegram(cost: RecoveryCost): string;
