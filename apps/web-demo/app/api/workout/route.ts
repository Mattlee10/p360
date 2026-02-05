import { NextRequest, NextResponse } from "next/server";
import { getWorkoutDecision } from "@/lib/workout";
import type {
  BiometricData,
  OuraReadinessData,
  OuraSleepData,
} from "@/lib/types";

const OURA_API_BASE = "https://api.ouraring.com/v2/usercollection";

async function fetchOuraData(token: string): Promise<BiometricData> {
  const today = new Date().toISOString().split("T")[0];

  // Fetch readiness data
  const readinessRes = await fetch(
    `${OURA_API_BASE}/daily_readiness?start_date=${today}&end_date=${today}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!readinessRes.ok) {
    if (readinessRes.status === 401) {
      throw new Error("Invalid Oura token. Please check your token and try again.");
    }
    throw new Error(`Oura API error: ${readinessRes.status}. Please try again later.`);
  }

  const readinessData: OuraReadinessData = await readinessRes.json();
  const readiness = readinessData.data[0];

  // Fetch sleep data
  const sleepRes = await fetch(
    `${OURA_API_BASE}/daily_sleep?start_date=${today}&end_date=${today}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!sleepRes.ok) {
    if (sleepRes.status === 401) {
      throw new Error("Invalid Oura token. Please check your token and try again.");
    }
    throw new Error(`Oura API error: ${sleepRes.status}. Please try again later.`);
  }

  const sleepData: OuraSleepData = await sleepRes.json();
  const sleep = sleepData.data[0];

  // Build BiometricData
  const biometricData: BiometricData = {
    date: today,
    readinessScore: readiness?.score ?? null,
    sleepScore: sleep?.score ?? null,
    hrvBalance: readiness?.contributors?.hrv_balance ?? null,
    restingHR: readiness?.contributors?.resting_heart_rate ?? null,
  };

  return biometricData;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const isDemo = searchParams.get("demo") === "true";

    // Demo mode - use fake data
    if (isDemo) {
      const demoBiometricData: BiometricData = {
        date: new Date().toISOString().split("T")[0],
        readinessScore: 85,
        sleepScore: 81,
        hrvBalance: 82,
        restingHR: 55,
      };
      const decision = getWorkoutDecision(demoBiometricData);
      return NextResponse.json(decision);
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing Oura token" },
        { status: 400 }
      );
    }

    // Fetch Oura data
    const biometricData = await fetchOuraData(token);

    // Get workout decision
    const decision = getWorkoutDecision(biometricData);

    return NextResponse.json(decision);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Oura data",
      },
      { status: 500 }
    );
  }
}
