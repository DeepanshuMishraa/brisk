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
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-[#1A1A1A]">
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
            className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-md"
          >
            New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-12 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className=" dark:text-gray-500 text-gray-400 text-sm font-light">
                Loading...
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-gray-400 dark:text-gray-500 text-sm font-light">
                No sessions yet
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.timestamp}
                  className="group py-5 px-4 rounded-lg border border-gray-200/30 dark:border-white/5 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-8">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium  dark:text-white text-gray-900 mb-1 truncate">
                        {session.goal}
                      </h3>
                      <div className="text-sm  dark:text-gray-400 text-gray-500 font-light">
                        {formatDate(session.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatTime(session.duration)}
                        </div>
                        {session.blocked_things.length > 0 && (
                          <div className="text-xs  dark:text-gray-500 text-gray-400 font-light mt-0.5">
                            {session.blocked_things.length}{" "}
                            {session.blocked_things.length === 1
                              ? "site"
                              : "sites"}{" "}
                            blocked
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {session.blocked_things.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/30 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-wrap gap-2">
                        {session.blocked_things.map((site, siteIndex) => (
                          <span
                            key={siteIndex}
                            className="text-xs px-2 py-1 rounded bg-gray-200/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-light"
                          >
                            {site}
                          </span>
                        ))}
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
