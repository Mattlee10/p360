"use strict";
// Simple in-memory storage for MVP
// TODO: Replace with Supabase for production
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
exports.setUser = setUser;
exports.setOuraToken = setOuraToken;
exports.getOuraToken = getOuraToken;
exports.setProvider = setProvider;
exports.getProvider = getProvider;
exports.getProviderToken = getProviderToken;
exports.hasConnectedDevice = hasConnectedDevice;
exports.updateLastCheck = updateLastCheck;
exports.getAllUsers = getAllUsers;
exports.getUsersWithMorningAlert = getUsersWithMorningAlert;
exports.addDrinkLog = addDrinkLog;
exports.getDrinkLogs = getDrinkLogs;
exports.addMoodEntry = addMoodEntry;
exports.getMoodEntries = getMoodEntries;
exports.getTodayMoodEntry = getTodayMoodEntry;
exports.addRecoveryScore = addRecoveryScore;
exports.getRecoveryHistory = getRecoveryHistory;
exports.incrementCommandCount = incrementCommandCount;
exports.getCommandCounts = getCommandCounts;
exports.getBotStats = getBotStats;
const users = new Map();
function getUser(telegramId) {
    return users.get(telegramId);
}
function setUser(telegramId, data) {
    const existing = users.get(telegramId);
    const updated = {
        telegramId,
        createdAt: existing?.createdAt ?? new Date(),
        ...existing,
        ...data,
    };
    users.set(telegramId, updated);
    return updated;
}
function setOuraToken(telegramId, token) {
    setUser(telegramId, { ouraToken: token });
}
function getOuraToken(telegramId) {
    return users.get(telegramId)?.ouraToken;
}
// Multi-device provider functions
function setProvider(telegramId, provider, token) {
    setUser(telegramId, { provider, providerToken: token });
    // Also set ouraToken for backward compatibility if Oura
    if (provider === "oura") {
        setUser(telegramId, { ouraToken: token });
    }
}
function getProvider(telegramId) {
    const user = users.get(telegramId);
    // Default to oura if legacy ouraToken exists but no provider set
    if (user?.ouraToken && !user.provider) {
        return "oura";
    }
    return user?.provider;
}
function getProviderToken(telegramId) {
    const user = users.get(telegramId);
    // Try providerToken first, fall back to legacy ouraToken
    return user?.providerToken || user?.ouraToken;
}
function hasConnectedDevice(telegramId) {
    const user = users.get(telegramId);
    return !!(user?.providerToken || user?.ouraToken);
}
function updateLastCheck(telegramId) {
    const user = users.get(telegramId);
    if (user) {
        user.lastCheckAt = new Date();
    }
}
function getAllUsers() {
    return Array.from(users.values());
}
function getUsersWithMorningAlert() {
    return getAllUsers().filter((u) => u.ouraToken && u.morningAlertTime);
}
// Drink log functions
function addDrinkLog(telegramId, amount) {
    const user = users.get(telegramId);
    const now = new Date();
    const log = {
        date: now.toISOString().split("T")[0],
        amount,
        timestamp: now,
    };
    if (user) {
        user.drinkLogs = user.drinkLogs || [];
        user.drinkLogs.push(log);
    }
    else {
        setUser(telegramId, { drinkLogs: [log] });
    }
    return log;
}
function getDrinkLogs(telegramId) {
    return users.get(telegramId)?.drinkLogs || [];
}
// ============================================
// Mood Tracking (P17)
// ============================================
function addMoodEntry(telegramId, score, note) {
    const user = users.get(telegramId);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const entry = {
        date: today,
        score,
        timestamp: now,
        note,
    };
    if (user) {
        user.moodEntries = user.moodEntries || [];
        // Replace entry if already logged today
        const existingIndex = user.moodEntries.findIndex((e) => e.date === today);
        if (existingIndex >= 0) {
            user.moodEntries[existingIndex] = entry;
        }
        else {
            user.moodEntries.push(entry);
        }
        // Keep only last 30 entries
        if (user.moodEntries.length > 30) {
            user.moodEntries = user.moodEntries.slice(-30);
        }
    }
    else {
        setUser(telegramId, { moodEntries: [entry] });
    }
    return entry;
}
function getMoodEntries(telegramId) {
    return users.get(telegramId)?.moodEntries || [];
}
function getTodayMoodEntry(telegramId) {
    const today = new Date().toISOString().split("T")[0];
    const entries = getMoodEntries(telegramId);
    return entries.find((e) => e.date === today);
}
function addRecoveryScore(telegramId, readiness) {
    const user = users.get(telegramId);
    if (user) {
        user.recoveryHistory = user.recoveryHistory || [];
        user.recoveryHistory.push(readiness);
        // Keep only last 30 entries
        if (user.recoveryHistory.length > 30) {
            user.recoveryHistory = user.recoveryHistory.slice(-30);
        }
    }
    else {
        setUser(telegramId, { recoveryHistory: [readiness] });
    }
}
function getRecoveryHistory(telegramId) {
    return users.get(telegramId)?.recoveryHistory || [];
}
// Command usage counters (in-memory, resets on restart)
const commandCounts = {
    workout: 0,
    drink: 0,
    demo: 0,
    drinkdemo: 0,
    why: 0,
    whydemo: 0,
    cost: 0,
    costdemo: 0,
};
function incrementCommandCount(command) {
    commandCounts[command]++;
}
function getCommandCounts() {
    return { ...commandCounts };
}
function getBotStats() {
    const allUsers = getAllUsers();
    const today = new Date().toISOString().split("T")[0];
    return {
        totalUsers: allUsers.length,
        connectedUsers: allUsers.filter(u => u.ouraToken).length,
        drinkUsers: allUsers.filter(u => u.drinkLogs && u.drinkLogs.length > 0).length,
        workoutChecks: commandCounts.workout + commandCounts.demo,
        drinkChecks: commandCounts.drink + commandCounts.drinkdemo,
        whyChecks: commandCounts.why + commandCounts.whydemo,
        todayNewUsers: allUsers.filter(u => u.createdAt.toISOString().split("T")[0] === today).length,
    };
}
