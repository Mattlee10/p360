"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface WorkoutDecision {
  verdict: "train_hard" | "train_light" | "rest";
  emoji: string;
  headline: string;
  subheadline: string;
  recommendations: string[];
  avoidList: string[];
  maxHeartRate?: number;
  recoveryRisk: string;
  tomorrowOutlook: string;
  dataSummary: {
    readiness: { value: number | null; status: string };
    hrv: { value: number | null; trend: string };
    sleep: { value: number | null };
  };
}

export default function ResultPage() {
  const searchParams = useSearchParams();
  const [decision, setDecision] = useState<WorkoutDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Missing token");
      setLoading(false);
      return;
    }

    fetch(`/api/workout?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDecision(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Analyzing your Oura data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (!decision) return null;

  const verdictColors = {
    train_hard: "bg-green-600",
    train_light: "bg-amber-600",
    rest: "bg-red-600",
  };

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-2">{decision.emoji}</div>
          <h1 className={`text-4xl font-bold text-white mb-2 ${verdictColors[decision.verdict]} inline-block px-6 py-2 rounded-lg`}>
            {decision.headline}
          </h1>
          <p className="text-lg text-slate-300 mt-4">{decision.subheadline}</p>
        </div>

        {/* Data Summary */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">Your Data</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">
                {decision.dataSummary.readiness.value ?? "N/A"}
              </div>
              <div className="text-xs text-slate-400">Readiness</div>
              <div className="text-xs text-slate-500">
                {decision.dataSummary.readiness.status}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {decision.dataSummary.hrv.value ?? "N/A"}
              </div>
              <div className="text-xs text-slate-400">HRV Balance</div>
              <div className="text-xs text-slate-500">
                {decision.dataSummary.hrv.trend}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {decision.dataSummary.sleep.value ?? "N/A"}
              </div>
              <div className="text-xs text-slate-400">Sleep</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-sm font-medium text-green-400 mb-3">✓ Recommended</h2>
          <ul className="space-y-2">
            {decision.recommendations.map((rec, i) => (
              <li key={i} className="text-slate-300">
                • {rec}
              </li>
            ))}
          </ul>

          {decision.avoidList.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-red-400 mb-3 mt-6">✗ Avoid</h2>
              <ul className="space-y-2">
                {decision.avoidList.map((item, i) => (
                  <li key={i} className="text-slate-300">
                    • {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          {decision.maxHeartRate && (
            <div className="mt-6 p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
              <p className="text-amber-300">
                💓 Keep your heart rate under{" "}
                <span className="font-bold">{decision.maxHeartRate} bpm</span>
              </p>
            </div>
          )}
        </div>

        {/* Outlook */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-3">
          <div>
            <span className="text-sm font-medium text-slate-400">⚠ Risk: </span>
            <span className="text-slate-300">{decision.recoveryRisk}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-slate-400">📅 Tomorrow: </span>
            <span className="text-slate-300">{decision.tomorrowOutlook}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/"
            className="flex-1 text-center py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Check Again
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-slate-500">
          Built with P360 Core Algorithm • Your data was not stored
        </p>
      </div>
    </div>
  );
}
