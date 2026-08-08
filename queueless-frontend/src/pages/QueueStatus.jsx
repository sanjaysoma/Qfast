import { useEffect, useState } from "react";

export default function QueueStatus() {
  const [queueData, setQueueData] = useState({
    serving: 12,
    yourToken: 15,
    ahead: 3,
    remainingMinutes: 12,
    totalQueue: 20,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueData((prev) => {
        const nextAhead = Math.max(prev.ahead - 1, 0);
        const nextServing = prev.yourToken - nextAhead;
        return {
          ...prev,
          serving: nextServing,
          ahead: nextAhead,
          remainingMinutes: Math.max(prev.remainingMinutes - 1, 5),
        };
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const progress = Math.min(100, Math.round(((queueData.totalQueue - queueData.ahead) / queueData.totalQueue) * 100));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-[28px] bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Live Queue</p>
              <h1 className="text-3xl font-semibold sm:text-4xl">Track your appointment in real time</h1>
            </div>
            <div className="rounded-3xl bg-slate-50 px-5 py-4 text-center">
              <p className="text-sm text-slate-500">Updates every 30 seconds</p>
              <p className="mt-2 text-2xl font-semibold text-primary">Auto refresh enabled</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Now Serving</p>
              <p className="mt-4 text-4xl font-semibold text-primary">{queueData.serving}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Your Token</p>
              <p className="mt-4 text-4xl font-semibold">{queueData.yourToken}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Patients Ahead</p>
              <p className="mt-4 text-4xl font-semibold text-warning">{queueData.ahead}</p>
            </div>
          </div>

          <div className="mt-10 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Estimated Remaining Time</p>
                <p className="mt-2 text-3xl font-semibold">{queueData.remainingMinutes} mins</p>
              </div>
              <p className="rounded-full bg-primary/10 px-4 py-2 text-primary font-semibold">{progress}% complete</p>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-10 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Queue Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-3xl border border-slate-200 p-4 sm:items-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">✓</span>
                <div>
                  <p className="font-semibold">Token 12</p>
                  <p className="text-sm text-slate-500">Now serving at reception</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:items-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">⏳</span>
                <div>
                  <p className="font-semibold">Token 13</p>
                  <p className="text-sm text-slate-500">Consultation in progress</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:items-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">⚠️</span>
                <div>
                  <p className="font-semibold">Token 15</p>
                  <p className="text-sm text-slate-500">Your turn coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
