import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { BackButton } from "@/components/BackButton";
import { GoalInput } from "@/components/GoalInput";
import { DurationSelect } from "@/components/DurationSelect";
import { BlockTags } from "@/components/BlockTags";
import { FooterButtons } from "@/components/FooterButtons";
import { PermissionDialog } from "@/components/PermissionDialog";
import { usePermissionStore } from "@/store/permissionStore";

interface Tag {
  id: string;
  label: string;
}

function parseDuration(duration: string): number {
  // Parse duration string to seconds
  const match = duration.match(/(\d+)\s*(minute|hour|minutes|hours)/i);
  if (!match) return 3600; // Default to 1 hour

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (unit.includes("hour")) {
    return value * 3600;
  } else if (unit.includes("minute")) {
    return value * 60;
  }

  return 3600; // Default to 1 hour
}

export default function App() {
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("1 hour");
  const [tags, setTags] = useState<Tag[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { hasPermission, permissionAsked, setHasPermission, setPermissionAsked } = usePermissionStore();

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  const handleAddTag = (label: string) => {
    if (tags.some((tag) => tag.label.toLowerCase() === label.toLowerCase())) {
      return;
    }
    setTags([...tags, { id: nextId.toString(), label }]);
    setNextId(nextId + 1);
  };

  const handleGrantPermission = () => {
    setHasPermission(true);
    setPermissionAsked(true);
  };

  const handleDenyPermission = () => {
    setHasPermission(false);
    setPermissionAsked(true);
  };

  const handleStartFocus = async () => {
    if (!goal.trim()) {
      alert("Please enter a goal for your focus session");
      return;
    }

    if (!hasPermission && permissionAsked) {
      alert("Please grant permission to block sites. You can start a session without blocking, but sites won't be blocked.");
    }

    setIsLoading(true);
    try {
      const durationSeconds = parseDuration(duration);
      const blockedSites = tags.map((tag) => tag.label);
      const sitesToBlock = hasPermission ? blockedSites : [];
      
      const result = await invoke<string>("create_and_store_session", {
        goal: goal.trim(),
        duration: durationSeconds,
        blockedThings: sitesToBlock,
      });

      console.log("Focus session started successfully!", result);
      setIsSessionActive(true);
      setTimeLeft(durationSeconds);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime === null || prevTime <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setIsSessionActive(false);
            invoke<string>("unblock_all_sites")
              .then(() => {
                console.log("Session ended automatically. Sites unblocked.");
              })
              .catch((error) => {
                console.error("Failed to unblock sites automatically:", error);
              });
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      alert(`Focus session started!\n${result}`);
    } catch (error) {
      console.error("Failed to start focus session:", error);
      alert(`Failed to start focus session: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopFocus = async () => {
    setIsLoading(true);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    try {
      const result = await invoke<string>("unblock_all_sites");
      console.log("Sites unblocked successfully!", result);
      setIsSessionActive(false);
      setTimeLeft(null);
      alert("Focus session stopped. Sites have been unblocked.");
    } catch (error) {
      console.error("Failed to stop focus session:", error);
      alert(`Failed to stop focus session: ${error}`);
      // Still reset state even if unblocking failed
      setIsSessionActive(false);
      setTimeLeft(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNew = () => {
    if (isSessionActive) {
      alert("Please stop the current session before starting a new one.");
      return;
    }
    setGoal("");
    setDuration("1 hour");
    setTags([]);
    setTimeLeft(null);
  };
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
      {!permissionAsked && (
        <PermissionDialog
          onGrant={handleGrantPermission}
          onDeny={handleDenyPermission}
        />
      )}
      
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-2xl"
        style={{
          background: `
            radial-gradient(1200px 600px at 10% 0%, rgba(255,255,255,0.02), transparent 60%),
            radial-gradient(800px 600px at 80% 40%, rgba(255,255,255,0.015), transparent 60%),
            radial-gradient(600px 400px at 50% 120%, rgba(0,0,0,0.3), transparent 60%),
            rgba(0, 0, 0, 0.7)
          `,
        }}
      />
      <div className="absolute inset-0 border border-white/8 rounded-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] pointer-events-none" />

      <div className="relative w-full max-w-3xl mx-auto flex flex-col h-screen px-6 py-6 z-10">
        <div className="flex items-start mb-6">
          <BackButton onClick={() => console.log("Back clicked")} />
        </div>
        <div className="space-y-6 px-2 flex-1">
          <GoalInput value={goal} onChange={setGoal} />
          <DurationSelect value={duration} onValueChange={setDuration} />
          <BlockTags tags={tags} onRemoveTag={handleRemoveTag} onAddTag={handleAddTag} />
        </div>
        <div className="mt-auto pt-4 border-white/10">
          <FooterButtons
            isSessionActive={isSessionActive}
            timeLeft={timeLeft}
            isLoading={isLoading}
            onStartFocus={handleStartFocus}
            onStopFocus={handleStopFocus}
            onStartNew={handleStartNew}
          />
        </div>
      </div>
    </div>
  );
}
