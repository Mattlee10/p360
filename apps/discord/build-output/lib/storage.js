"use strict";
// Simple in-memory storage for MVP
// TODO: Replace with Supabase for production
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
exports.setUser = setUser;
exports.setProvider = setProvider;
exports.getProvider = getProvider;
exports.getProviderToken = getProviderToken;
exports.hasConnectedDevice = hasConnectedDevice;
exports.updateLastCheck = updateLastCheck;
exports.addDrinkLog = addDrinkLog;
exports.getDrinkLogs = getDrinkLogs;
exports.addMoodEntry = addMoodEntry;
exports.getMoodEntries = getMoodEntries;
exports.addRecoveryScore = addRecoveryScore;
exports.getRecoveryHistory = getRecoveryHistory;
exports.getAllUsers = getAllUsers;
const users = new Map();
function getUser(discordId) {
    return users.get(discordId);
}
function setUser(discordId, data) {
    const existing = users.get(discordId);
    const updated = {
        discordId,
        createdAt: existing?.createdAt ?? new Date(),
        ...existing,
        ...data,
    };
    users.set(discordId, updated);
    return updated;
}
function setProvider(discordId, provider, token) {
    setUser(discordId, { provider, providerToken: token });
}
function getProvider(discordId) {
    return users.get(discordId)?.provider;
}
function getProviderToken(discordId) {
    return users.get(discordId)?.providerToken;
}
function hasConnectedDevice(discordId) {
    return !!users.get(discordId)?.providerToken;
}
function updateLastCheck(discordId) {
    const user = users.get(discordId);
    if (user) {
        user.lastCheckAt = new Date();
    }
}
// Drink logs
function addDrinkLog(discordId, amount) {
    const user = users.get(discordId);
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
        setUser(discordId, { drinkLogs: [log] });
    }
    return log;
}
function getDrinkLogs(discordId) {
    return users.get(discordId)?.drinkLogs || [];
}
// Mood tracking
function addMoodEntry(discordId, score, note) {
    const user = users.get(discordId);
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
        const existingIndex = user.moodEntries.findIndex((e) => e.date === today);
        if (existingIndex >= 0) {
            user.moodEntries[existingIndex] = entry;
        }
        else {
            user.moodEntries.push(entry);
        }
        if (user.moodEntries.length > 30) {
            user.moodEntries = user.moodEntries.slice(-30);
        }
    }
    else {
        setUser(discordId, { moodEntries: [entry] });
    }
    return entry;
}
function getMoodEntries(discordId) {
    return users.get(discordId)?.moodEntries || [];
}
function addRecoveryScore(discordId, readiness) {
    const user = users.get(discordId);
    if (user) {
        user.recoveryHistory = user.recoveryHistory || [];
        user.recoveryHistory.push(readiness);
        if (user.recoveryHistory.length > 30) {
            user.recoveryHistory = user.recoveryHistory.slice(-30);
        }
    }
    else {
        setUser(discordId, { recoveryHistory: [readiness] });
    }
}
function getRecoveryHistory(discordId) {
    return users.get(discordId)?.recoveryHistory || [];
}
// Stats
function getAllUsers() {
    return Array.from(users.values());
}
