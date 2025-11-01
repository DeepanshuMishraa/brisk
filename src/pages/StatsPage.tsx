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
    // Resize window to stats size when stats page loads
    const timer = setTimeout(() => {
      invoke<string>("resize_window_to_stats").catch((error) => {
        console.error("Failed to resize window on stats page mount:", error);
      });
    }, 100);

    // Fetch all sessions
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
    // Resize back to main window size before navigating
    try {
      await invoke<string>("resize_window_to_main");
      // Wait longer to ensure resize completes
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to resize to main:", error);
    }
    reset();
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#1A1A1A]">
      <div className="w-full max-w-5xl mx-auto flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-12 py-8 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleStartNew}
              variant="outline"
              size="icon"
              className="border-white/10 hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-light tracking-tight text-white">Sessions</h1>
          </div>
          <button
            onClick={handleStartNew}
            className="px-5 py-2 bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors rounded-md"
          >
            New Session
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-12 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm font-light">Loading...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-gray-500 text-sm font-light">No sessions yet</div>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.timestamp}
                  className="group py-5 px-4 rounded-lg border border-white/5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-8">
                    {/* Left: Goal and Time */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-white mb-1 truncate">
                        {session.goal}
                      </h3>
                      <div className="text-sm text-gray-400 font-light">
                        {formatDate(session.timestamp)}
                      </div>
                    </div>

                    {/* Right: Duration and Blocked Sites */}
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {formatTime(session.duration)}
                        </div>
                        {session.blocked_things.length > 0 && (
                          <div className="text-xs text-gray-500 font-light mt-0.5">
                            {session.blocked_things.length} {session.blocked_things.length === 1 ? 'site' : 'sites'} blocked
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Blocked Sites List - Show on hover or expand */}
                  {session.blocked_things.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-wrap gap-2">
                        {session.blocked_things.map((site, siteIndex) => (
                          <span
                            key={siteIndex}
                            className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 font-light"
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
