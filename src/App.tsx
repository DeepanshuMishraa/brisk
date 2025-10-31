import { useState } from "react";
import "./App.css";
import { BackButton } from "@/components/BackButton";
import { GoalInput } from "@/components/GoalInput";
import { DurationSelect } from "@/components/DurationSelect";
import { BlockTags } from "@/components/BlockTags";
import { FooterButtons } from "@/components/FooterButtons";

export default function App() {
  const [goal, setGoal] = useState("Write API documentation");
  const [duration, setDuration] = useState("1 hour");
  const [tags, setTags] = useState([
    { id: "1", label: "Messaging" },
    { id: "2", label: "Social Media" },
    { id: "3", label: "youtube.com" },
    { id: "4", label: "DaVinci Resolve" },
  ]);

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  const handleStartFocus = () => {
    console.log("Start Focus Session");
  };

  const handleStartNew = () => {
    console.log("Start New Session");
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
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
          <BlockTags tags={tags} onRemoveTag={handleRemoveTag} />
        </div>
        <div className="mt-auto pt-4 border-t border-white/10">
          <FooterButtons
            onStartFocus={handleStartFocus}
            onStartNew={handleStartNew}
          />
        </div>
      </div>
    </div>
  );
}
