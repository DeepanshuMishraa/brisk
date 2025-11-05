import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useSessionStore } from "@/store/sessionStore";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Session {
  goal: string;
  duration: number;
  blocked_things: string[];
  blocked_apps: string[];
  timestamp: number;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `<1m`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (isYesterday) {
    return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatsPage() {
  const navigate = useNavigate();
  const { reset } = useSessionStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      invoke<string>("resize_window_to_stats").catch((error) => {
        console.error("Failed to resize window on stats page mount:", error);
      });
    }, 100);

    invoke<Session[]>("get_all_sessions")
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch sessions:", error);
        setLoading(false);
      });

    return () => clearTimeout(timer);
  }, []);

  const handleStartNew = async () => {
    try {
      await invoke<string>("resize_window_to_main");
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to resize to main:", error);
    }
    reset();
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="w-full max-w-5xl mx-auto flex flex-col h-screen">
        <div className="flex items-center justify-between px-12 py-8 border-b border-gray-200/30 dark:border-white/10">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleStartNew}
              variant="outline"
              size="icon"
              className="border-gray-300/30 dark:border-white/10 hover:bg-gray-100/50 dark:hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-lighter text-gray-900 dark:text-white">
              Sessions
            </h1>
          </div>
          <button
            onClick={handleStartNew}
            className="px-5 py-2 text-sm font-medium hover:bg-[#9ae600] bg-[#acfa02] text-gray-800 transition-colors rounded-md active:scale-[0.98] duration-150"
          >
            New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-12 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                Loading...
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                No sessions yet
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div
                  key={session.timestamp && index}
                  className="group relative py-5 px-6 rounded-xl border border-gray-200/60 dark:border-white/[0.08] bg-white dark:bg-[#121212] hover:border-gray-300/80 dark:hover:border-white/[0.14] hover:shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_2px_16px_rgba(0,0,0,0.3)] transition-all duration-200"
                >
                  <div className="relative flex items-start justify-between gap-8">
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-50 truncate leading-tight">
                        {session.goal}
                      </h3>
                      <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                        {formatDate(session.timestamp)}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.08] dark:from-emerald-400/[0.12] dark:to-teal-400/[0.12] border border-emerald-500/20 dark:border-emerald-400/20">
                          <span className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
                            {formatTime(session.duration)}
                          </span>
                        </div>
                        {(session.blocked_things.length > 0 ||
                          session.blocked_apps.length > 0) && (
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                            {session.blocked_things.length > 0 && (
                              <div>
                                {session.blocked_things.length}{" "}
                                {session.blocked_things.length === 1
                                  ? "site"
                                  : "sites"}
                              </div>
                            )}
                            {session.blocked_apps.length > 0 && (
                              <div>
                                {session.blocked_apps.length}{" "}
                                {session.blocked_apps.length === 1
                                  ? "app"
                                  : "apps"}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {(session.blocked_things.length > 0 ||
                    session.blocked_apps.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-white/[0.06]">
                      <div className="space-y-3">
                        {session.blocked_things.length > 0 && (
                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                              Blocked Sites
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {session.blocked_things.map((site, siteIndex) => (
                                <span
                                  key={`site-${siteIndex}`}
                                  className="inline-flex items-center text-[11px] px-2.5 py-1.5 rounded-md bg-blue-100/50 dark:bg-blue-500/[0.15] text-blue-700 dark:text-blue-300 font-medium border border-blue-200/50 dark:border-blue-500/[0.2] hover:bg-blue-200/50 dark:hover:bg-blue-500/[0.2] transition-colors"
                                >
                                  {site}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {session.blocked_apps.length > 0 && (
                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                              Blocked Apps
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {session.blocked_apps.map((app, appIndex) => (
                                <span
                                  key={`app-${appIndex}`}
                                  className="inline-flex items-center text-[11px] px-2.5 py-1.5 rounded-md bg-orange-100/50 dark:bg-orange-500/[0.15] text-orange-700 dark:text-orange-300 font-medium border border-orange-200/50 dark:border-orange-500/[0.2] hover:bg-orange-200/50 dark:hover:bg-orange-500/[0.2] transition-colors"
                                >
                                  {app}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
