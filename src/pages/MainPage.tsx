import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { GoalInput } from "@/components/GoalInput";
import { DurationSelect } from "@/components/DurationSelect";
import { BlockTags } from "@/components/BlockTags";
import { FooterButtons } from "@/components/FooterButtons";
import { Layout } from "@/components/Layout";
import { ModeToggle } from "@/components/mode-toggle";
import { useSessionStore } from "@/store/sessionStore";
import { parseDuration } from "@/lib/utils";
import { Tag } from "@/lib/types";

export function MainPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("1 hour");
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { setSession } = useSessionStore();

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  const handleAddTag = (tag: Tag) => {
    if (
      tags.some(
        (t) =>
          t.label.toLowerCase() === tag.label.toLowerCase() &&
          t.type === tag.type,
      )
    ) {
      return;
    }
    setTags([...tags, tag]);
  };

  const handleStartFocus = async () => {
    if (!goal.trim()) {
      alert("Please enter a goal for your focus session");
      return;
    }

    setIsLoading(true);
    try {
      const durationSeconds = parseDuration(duration);

      const blockedSites = tags
        .filter((tag) => tag.type === "website")
        .map((tag) => tag.label);

      const blockedApps = tags
        .filter((tag) => tag.type === "app")
        .map((tag) => `${tag.label}|||${tag.executable || tag.label}|||${tag.icon || ''}`);

      const result = await invoke<string>("create_and_store_session", {
        goal: goal.trim(),
        duration: durationSeconds,
        blockedThings: blockedSites,
        blockedApps: blockedApps,
      });

      console.log("Focus session started successfully!", result);
      setSession(goal.trim(), durationSeconds, blockedApps);
      navigate("/widget");
    } catch (error) {
      console.error("Failed to start focus session:", error);
      alert(`Failed to start focus session: ${error}`);
      setIsLoading(false);
    }
  };

  const handleViewStats = async () => {
    try {
      await invoke<string>("resize_window_to_stats");
      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate("/stats");
    } catch (error) {
      console.error("Failed to resize window to stats:", error);
      navigate("/stats");
    }
  };

  return (
    <Layout>
      <div className="flex items-start mb-6">
        <ModeToggle />
      </div>

      <div className="space-y-6 px-2 flex-1">
        <GoalInput value={goal} onChange={setGoal} />
        <DurationSelect value={duration} onValueChange={setDuration} />
        <BlockTags
          tags={tags}
          onRemoveTag={handleRemoveTag}
          onAddTag={handleAddTag}
        />
      </div>

      <div className="mt-auto pt-6">
        <FooterButtons
          isSessionActive={false}
          timeLeft={null}
          isLoading={isLoading}
          onStartFocus={handleStartFocus}
          onViewStats={handleViewStats}
        />
      </div>
    </Layout>
  );
}
