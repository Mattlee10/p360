"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    router.push(`/result?token=${encodeURIComponent(token)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Should I work out today?
          </h1>
          <p className="text-lg text-slate-400">
            Get a clear answer from your Oura Ring data
          </p>
        </div>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-2">
              Oura Personal Access Token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your token here"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-slate-500">
              Get your token at{" "}
              <a
                href="https://cloud.ouraring.com/personal-access-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                cloud.ouraring.com
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={!token.trim() || loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Checking..." : "Check Now"}
          </button>
        </form>

        {/* Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-2">How it works</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Reads your latest Oura readiness, HRV, and sleep data</li>
            <li>• Gives you a clear verdict: Train Hard, Train Light, or Rest</li>
            <li>• Specific recommendations on what to do and avoid</li>
          </ul>
        </div>

        {/* Privacy */}
        <p className="text-xs text-center text-slate-500">
          Your token is only used for this one-time check. Nothing is stored.
        </p>
      </div>
    </div>
  );
}
