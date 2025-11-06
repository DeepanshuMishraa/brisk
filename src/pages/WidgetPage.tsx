import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useSessionStore } from "@/store/sessionStore";
import { FocusWidget } from "@/components/FocusWidget";
import { BlockNotificationWidget } from "@/components/BlockNotificationWidget";

export function WidgetPage() {
  const navigate = useNavigate();
  const { goal, duration, timeLeft, updateTimeLeft, blockedApps } = useSessionStore();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingRef = useRef(false);
  
  const hasBlockedApps = blockedApps && blockedApps.length > 0;

  const playFinishSound = async () => {
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio();
      audio.volume = 1.0;
      
      audio.addEventListener('ended', () => {
        resolve();
      });
      
      audio.addEventListener('error', (e) => {
        console.error("Audio error:", e);
        reject(e);
      });
      
      audio.src = '/finish.mp3';
      
      audio.play().catch(err => {
        console.error("Play failed:", err);
        reject(err);
      });
    });
  };

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
          playFinishSound().catch(err => console.error("Sound error:", err));
          
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          navigate("/stats", { replace: true });
          
          await new Promise((resolve) => setTimeout(resolve, 100));
          
          await invoke<string>("resize_window_to_stats");
          
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
    <>
      <BlockNotificationWidget isActive={hasBlockedApps} />
      <div className="w-full h-full flex items-center justify-center bg-transparent p-0 m-0">
        <FocusWidget goal={goal} duration={duration} timeLeft={timeLeft} />
      </div>
    </>
  );
}
