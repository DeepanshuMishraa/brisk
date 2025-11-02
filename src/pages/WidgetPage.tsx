import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useSessionStore } from "@/store/sessionStore";
import { FocusWidget } from "@/components/FocusWidget";

export function WidgetPage() {
  const navigate = useNavigate();
  const { goal, duration, timeLeft, updateTimeLeft } = useSessionStore();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingRef = useRef(false);

  useEffect(() => {
    invoke<string>("resize_window_to_widget").catch((error) => {
      console.error("Failed to resize window:", error);
    });
  }, []);

  useEffect(() => {
    if (duration > 0 && timeLeft === 0 && !isEndingRef.current) {
      isEndingRef.current = true;

      console.log("Session ended, navigating to stats...");

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const handleSessionEnd = async () => {
        try {
          console.log("Navigating to stats page first...");
          navigate("/stats", { replace: true });
          
          await new Promise((resolve) => setTimeout(resolve, 100));
          
          console.log("Resizing window to stats size...");
          await invoke<string>("resize_window_to_stats");
          
          console.log("Unblocking sites...");
          await invoke<string>("unblock_all_sites");
        } catch (error) {
          console.error("Error in session end sequence:", error);
          navigate("/stats", { replace: true });
        }
      };

      handleSessionEnd();
    }
  }, [timeLeft, duration, navigate]);

  useEffect(() => {
    if (duration > 0 && timeLeft > 0) {
      isEndingRef.current = false;
    }
    if (duration > 0 && timeLeft > 0 && !isEndingRef.current) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      timerIntervalRef.current = setInterval(() => {
        updateTimeLeft((currentTime) => {
          const newTime = currentTime - 1;
          return Math.max(0, newTime);
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [duration, timeLeft, updateTimeLeft]);

  if (!goal || duration === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-transparent">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent p-0 m-0 overflow-hidden">
      <FocusWidget goal={goal} duration={duration} timeLeft={timeLeft} />
    </div>
  );
}
