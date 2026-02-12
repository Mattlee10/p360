interface OuraDailySleep {
    id: string;
    day: string;
    score: number | null;
    timestamp: string;
    contributors: {
        deep_sleep: number | null;
        efficiency: number | null;
        latency: number | null;
        rem_sleep: number | null;
        restfulness: number | null;
        timing: number | null;
        total_sleep: number | null;
    };
}
interface OuraDailyReadiness {
    id: string;
    day: string;
    score: number | null;
    timestamp: string;
    contributors: {
        activity_balance: number | null;
        body_temperature: number | null;
        hrv_balance: number | null;
        previous_day_activity: number | null;
        previous_night: number | null;
        recovery_index: number | null;
        resting_heart_rate: number | null;
        sleep_balance: number | null;
    };
}
interface OuraSleepData {
    data: OuraDailySleep[];
}
interface OuraReadinessData {
    data: OuraDailyReadiness[];
}

interface BiometricData {
    sleepScore: number | null;
    readinessScore: number | null;
    hrvBalance: number | null;
    restingHR: number | null;
    date: string;
    hrvBaseline?: number | null;
    sleepBaseline?: number | null;
}
type DecisionCategory = "email" | "meeting" | "financial" | "workout" | "creative" | "negotiation" | "general";
type DecisionImportance = "low" | "medium" | "high" | "critical";
interface DecisionContext {
    category: DecisionCategory;
    importance: DecisionImportance;
    description?: string;
}
type ReadinessStatus = "excellent" | "good" | "caution" | "poor";
type ActionVerdict = "proceed" | "proceed_with_caution" | "wait" | "stop";
interface ActionableInsight {
    verdict: ActionVerdict;
    headline: string;
    action: string;
    rationale: string;
    retryIn?: string;
    fallback?: string;
    risk?: string;
}
interface DecisionReadiness {
    score: number;
    status: ReadinessStatus;
    message: string;
    recommendation: string;
    metrics: {
        sleep: {
            value: number | null;
            label: string;
        };
        readiness: {
            value: number | null;
            label: string;
        };
        hrv: {
            value: number | null;
            label: string;
        };
    };
    insight: ActionableInsight;
}

/**
 * BiometricProvider interface
 *
 * All wearable device integrations (Oura, WHOOP, etc.) must implement this interface.
 * This abstraction allows the algorithms to work with any data source.
 */
interface BiometricProvider {
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
type ProviderType = "oura" | "whoop";

/**
 * OuraProvider - Oura Ring API integration
 *
 * Fetches biometric data from Oura Ring API v2.
 * Uses Personal Access Token (PAT) authentication.
 */
declare class OuraProvider implements BiometricProvider {
    readonly name = "oura";
    readonly displayName = "Oura Ring";
    /**
     * Fetch today's biometric data from Oura API
     */
    fetchBiometricData(token: string): Promise<BiometricData>;
    /**
     * Validate that the token is working by hitting the personal_info endpoint
     */
    validateToken(token: string): Promise<boolean>;
    private fetchSleepData;
    private fetchReadinessData;
    private parseBiometricData;
}

/**
 * WHOOP Provider
 *
 * Fetches biometric data from WHOOP API.
 * Requires an OAuth access token.
 *
 * HRV Normalization:
 * WHOOP reports raw HRV in milliseconds (hrv_rmssd_milli).
 * We normalize to 0-100 scale where:
 * - 50 = baseline (roughly 60ms RMSSD for average user)
 * - <50 = below baseline (nervous system stressed)
 * - >50 = above baseline (well recovered)
 *
 * Formula: min(100, max(0, hrvRmssd / 1.2))
 * - 60ms -> 50 (baseline)
 * - 120ms -> 100 (excellent)
 * - 30ms -> 25 (stressed)
 */
declare class WhoopProvider implements BiometricProvider {
    readonly name = "whoop";
    readonly displayName = "WHOOP";
    /**
     * Normalize WHOOP HRV (milliseconds) to 0-100 scale
     * WHOOP raw RMSSD is typically 20-150ms
     * Using 60ms as baseline (50 on our scale)
     */
    private normalizeHrv;
    fetchBiometricData(token: string): Promise<BiometricData>;
    validateToken(token: string): Promise<boolean>;
    private fetchRecovery;
    private fetchSleep;
}

/**
 * WHOOP API Types
 *
 * Based on WHOOP API v1
 * https://developer.whoop.com/api
 */
interface WhoopRecovery {
    cycle_id: number;
    sleep_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
    score: {
        user_calibrating: boolean;
        recovery_score: number;
        resting_heart_rate: number;
        hrv_rmssd_milli: number;
        spo2_percentage?: number;
        skin_temp_celsius?: number;
    } | null;
}
interface WhoopSleep {
    id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    start: string;
    end: string;
    timezone_offset: string;
    nap: boolean;
    score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
    score: {
        stage_summary: {
            total_in_bed_time_milli: number;
            total_awake_time_milli: number;
            total_no_data_time_milli: number;
            total_light_sleep_time_milli: number;
            total_slow_wave_sleep_time_milli: number;
            total_rem_sleep_time_milli: number;
            sleep_cycle_count: number;
            disturbance_count: number;
        };
        sleep_needed: {
            baseline_milli: number;
            need_from_sleep_debt_milli: number;
            need_from_recent_strain_milli: number;
            need_from_recent_nap_milli: number;
        };
        respiratory_rate: number;
        sleep_performance_percentage: number;
        sleep_consistency_percentage: number;
        sleep_efficiency_percentage: number;
    } | null;
}
interface WhoopCycle {
    id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    start: string;
    end: string | null;
    timezone_offset: string;
    score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
    score: {
        strain: number;
        kilojoule: number;
        average_heart_rate: number;
        max_heart_rate: number;
    } | null;
}
interface WhoopListResponse<T> {
    records: T[];
    next_token?: string;
}

/**
 * Calculate decision readiness with actionable insights
 *
 * @param data - Biometric data from Oura or other source
 * @param context - Optional decision context for tailored insights
 * @returns DecisionReadiness with score, status, and actionable insight
 */
declare function calculateDecisionReadiness(data: BiometricData, context?: DecisionContext): DecisionReadiness;
/**
 * Quick check for a specific decision category
 * Returns just the actionable insight without full metrics
 */
declare function quickCheck(data: BiometricData, category: DecisionCategory, importance?: DecisionImportance): ActionableInsight;
/**
 * Get status emoji for display
 */
declare function getStatusEmoji(status: ReadinessStatus): string;
/**
 * Get verdict emoji for display
 */
declare function getVerdictEmoji$1(verdict: ActionVerdict): string;
/**
 * Get status color (hex)
 */
declare function getStatusColor(status: ReadinessStatus): string;
/**
 * Get verdict color (hex)
 */
declare function getVerdictColor$1(verdict: ActionVerdict): string;

type WorkoutVerdict = "train_hard" | "train_light" | "rest";
type Sport = "basketball" | "running" | "cycling" | "weightlifting" | "crossfit" | "swimming" | "yoga" | "soccer" | "tennis" | "golf" | "hiking" | "climbing" | "martial_arts" | "general";
interface SportGuide {
    sport: Sport;
    displayName: string;
    todayAdvice: string;
    intensityTips: string[];
    warmup: string;
    duration: string;
    cautionNotes?: string[];
}
interface IntensityGuide {
    cardio: string;
    weights: string;
    duration: string;
    rpe: string;
}
interface WorkoutDecision {
    verdict: WorkoutVerdict;
    confidence: number;
    emoji: string;
    headline: string;
    subheadline: string;
    recommendations: string[];
    avoidList: string[];
    maxHeartRate?: number;
    suggestedZone?: string;
    recoveryRisk: string;
    tomorrowOutlook: string;
    dataSummary: {
        readiness: {
            value: number | null;
            status: string;
        };
        hrv: {
            value: number | null;
            trend: string;
        };
        sleep: {
            value: number | null;
            hours?: string;
        };
    };
    reasoning: string[];
    intensityGuide: IntensityGuide;
    sportGuide?: SportGuide;
}
declare function getSportGuide(sport: Sport, verdict: WorkoutVerdict): SportGuide;
declare function getWorkoutDecision(data: BiometricData, sport?: Sport): WorkoutDecision;
declare function parseSport(input?: string): Sport | undefined;
declare function getSportList(): string[];
declare function formatWorkoutCLI(decision: WorkoutDecision): string;
declare function formatWorkoutJSON(decision: WorkoutDecision): string;
declare function getVerdictEmoji(verdict: WorkoutVerdict): string;
declare function getVerdictColor(verdict: WorkoutVerdict): string;

interface DrinkLog {
    date: string;
    amount: number;
    timestamp: Date;
}
type DrinkVerdict = "green" | "yellow" | "red";
interface DrinkImpact {
    drinks: number;
    hrvDrop: string;
    recoveryTime: string;
    fatigue: string;
}
interface DrinkDecision {
    verdict: DrinkVerdict;
    greenLimit: number;
    yellowLimit: number;
    redThreshold: number;
    emoji: string;
    headline: string;
    subheadline: string;
    impacts: DrinkImpact[];
    tips: string[];
    dataSummary: {
        readiness: {
            value: number | null;
            status: string;
        };
        hrv: {
            value: number | null;
            trend: string;
        };
        sleep: {
            value: number | null;
        };
    };
    reasoning: string[];
}
interface DrinkHistory {
    logs: DrinkLog[];
    avgPerWeek: number;
    avgPerSession: number;
    personalSafeLimit?: number;
    patterns: {
        drinks: number;
        avgHrvDrop: number;
        avgRecoveryDays: number;
    }[];
}
interface SocialStrategy {
    headline: string;
    limit: number;
    tips: string[];
    reminderIntervals: number[];
}
declare function getDrinkDecision(data: BiometricData, history?: DrinkHistory): DrinkDecision;
declare function getSocialStrategy(decision: DrinkDecision): SocialStrategy;
declare function calculateDrinkHistory(logs: DrinkLog[]): DrinkHistory;

type WhyCategory = "mood" | "energy" | "focus" | "willpower" | "general";
type WhyVerdict = "physiological" | "mixed" | "psychological";
type GapDirection = "aligned" | "body-worse" | "mind-worse";
interface WhyUserInput {
    category?: WhyCategory;
    subjectiveScore?: number;
    keywords: string[];
    rawText: string;
}
interface GapAnalysis {
    direction: GapDirection;
    subjectiveScore: number;
    objectiveScore: number;
    explanation: string;
}
interface WhyDataSummary {
    readiness: {
        value: number | null;
        status: string;
    };
    hrv: {
        value: number | null;
        trend: string;
    };
    sleep: {
        value: number | null;
    };
}
interface WhyDecision {
    verdict: WhyVerdict;
    emoji: string;
    headline: string;
    subheadline: string;
    gapAnalysis?: GapAnalysis;
    explanation: string;
    mindBodyStatement: string;
    dataSummary: WhyDataSummary;
    recommendations: string[];
    risk: string;
    reasoning: string[];
}
declare function parseWhyInput(text: string): WhyUserInput;
declare function analyzeGap(subjectiveScore: number, data: BiometricData): GapAnalysis;
declare function getWhyDecision(data: BiometricData, userInput?: WhyUserInput): WhyDecision;

/**
 * P17 Mood Feature
 *
 * Core insight: Users often blame themselves psychologically (anxiety, laziness)
 * when the actual cause is physiological (low HRV, poor sleep).
 * This module helps with "attribution correction".
 *
 * Four scenarios:
 * A: Recovery ↓ + Mood ↓ → "IT'S YOUR BODY, NOT YOUR MIND" (key insight)
 * B: Recovery ↑ + Mood ↓ → "External factors may be involved"
 * C: Recovery ↓ + Mood ↑ → "Body recovering, don't overdo it"
 * D: Recovery ↑ + Mood ↑ → "Great day to challenge yourself!"
 */

interface MoodEntry {
    date: string;
    score: number;
    timestamp: Date;
    note?: string;
}
type MoodScenario = "A" | "B" | "C" | "D";
interface MoodAttribution {
    scenario: MoodScenario;
    emoji: string;
    headline: string;
    subheadline: string;
    explanation: string;
    recommendations: string[];
    isPhysiological: boolean;
}
interface MoodInsight {
    correlation: number | null;
    dataPoints: number;
    trend: "positive" | "negative" | "neutral" | "insufficient_data";
    summary: string;
    insight: string;
}
interface MoodDecision {
    scenario: MoodScenario;
    attribution: MoodAttribution;
    dataSummary: {
        readiness: number | null;
        recoveryStatus: "low" | "moderate" | "high";
        moodScore: number;
        moodStatus: "low" | "moderate" | "high";
    };
    moodHistory?: MoodInsight;
}
/**
 * Get mood attribution based on biometric data and mood score
 */
declare function getMoodAttribution(data: BiometricData, moodScore: number): MoodAttribution;
/**
 * Calculate Pearson correlation between two arrays
 */
declare function calculatePearsonCorrelation(x: number[], y: number[]): number | null;
/**
 * Calculate mood insight from historical data
 */
declare function calculateMoodInsight(moodEntries: MoodEntry[], recoveryScores: number[]): MoodInsight;
/**
 * Main mood decision function
 */
declare function getMoodDecision(data: BiometricData, moodScore: number, moodHistory?: MoodEntry[], recoveryHistory?: number[]): MoodDecision;

type SubstanceType = "beer" | "wine" | "spirits" | "coffee" | "tea";
type SubstanceCategory = "alcohol" | "caffeine";
interface DayCost {
    day: number;
    label: string;
    hrvChange: number;
    recoveryDrop: number;
    workoutCapacity: string;
    sleepImpact?: string;
}
interface RecoveryCost {
    substance: SubstanceType;
    category: SubstanceCategory;
    amount: number;
    emoji: string;
    headline: string;
    subheadline: string;
    timeline: DayCost[];
    totalRecoveryDays: number;
    tradeoff: string;
    dataSummary: {
        readiness: {
            value: number | null;
            status: string;
        };
        hrv: {
            value: number | null;
            trend: string;
        };
        sleep: {
            value: number | null;
        };
    };
}
declare function parseSubstance(input: string): SubstanceType | null;
declare function getRecoveryCost(data: BiometricData, substance: SubstanceType, amount: number): RecoveryCost;
declare function getSubstanceList(): string[];
declare function getSubstanceCategory(substance: SubstanceType): SubstanceCategory;

/**
 * Get static demo data
 */
declare function getDemoData(): BiometricData;
/**
 * Get random demo data from 5 realistic scenarios
 * - Scenario 1: Excellent recovery (green light)
 * - Scenario 2: Good recovery (proceed)
 * - Scenario 3: Moderate recovery (caution)
 * - Scenario 4: Poor recovery (rest recommended)
 * - Scenario 5: Very poor recovery (rest required)
 */
declare function getRandomDemoData(): BiometricData;
/**
 * Get specific demo scenario by index (0-4)
 * Useful for testing specific conditions
 */
declare function getDemoScenario(index: number): BiometricData;

export { type ActionVerdict, type ActionableInsight, type BiometricData, type BiometricProvider, type DayCost, type DecisionCategory, type DecisionContext, type DecisionImportance, type DecisionReadiness, type DrinkDecision, type DrinkHistory, type DrinkImpact, type DrinkLog, type DrinkVerdict, type GapAnalysis, type GapDirection, type IntensityGuide, type MoodAttribution, type MoodDecision, type MoodEntry, type MoodInsight, type MoodScenario, type OuraDailyReadiness, type OuraDailySleep, OuraProvider, type OuraReadinessData, type OuraSleepData, type ProviderType, type ReadinessStatus, type RecoveryCost, type SocialStrategy, type Sport, type SportGuide, type SubstanceCategory, type SubstanceType, type WhoopCycle, type WhoopListResponse, WhoopProvider, type WhoopRecovery, type WhoopSleep, type WhyCategory, type WhyDataSummary, type WhyDecision, type WhyUserInput, type WhyVerdict, type WorkoutDecision, type WorkoutVerdict, analyzeGap, calculateDecisionReadiness, calculateDrinkHistory, calculateMoodInsight, calculatePearsonCorrelation, formatWorkoutCLI, formatWorkoutJSON, getDemoData, getDemoScenario, getDrinkDecision, getMoodAttribution, getMoodDecision, getRandomDemoData, getRecoveryCost, getSocialStrategy, getSportGuide, getSportList, getStatusColor, getStatusEmoji, getSubstanceCategory, getSubstanceList, getVerdictColor$1 as getVerdictColor, getVerdictEmoji$1 as getVerdictEmoji, getWhyDecision, getWorkoutDecision, getVerdictColor as getWorkoutVerdictColor, getVerdictEmoji as getWorkoutVerdictEmoji, parseSport, parseSubstance, parseWhyInput, quickCheck };
