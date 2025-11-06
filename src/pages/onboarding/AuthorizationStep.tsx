import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useNavigate } from "react-router-dom";

interface AuthorizationStepProps {
  onPrev: () => void;
}

export function AuthorizationStep({ onPrev }: AuthorizationStepProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setOnboarded, setAuthorizationCompleted } = useOnboardingStore();
  const navigate = useNavigate();

  const handleGrantAccess = async () => {
    setIsAuthorizing(true);
    setError(null);

    try {
      await invoke<string>("setup_persistent_authorization");
      setAuthorizationCompleted(true);
      setOnboarded(true);
      navigate("/");
    } catch (err) {
      console.error("Authorization failed:", err);
      setError(
        typeof err === "string" 
          ? err 
          : "Authorization failed. Please verify your password."
      );
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-14 w-full max-w-lg">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-white">
            One more thing
          </h1>
          <p className="text-lg text-black/70 dark:text-white/70 leading-relaxed max-w-md">
            Brisq needs system permission to block websites during your focus sessions.
          </p>
        </div>
        <div className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-8 py-6">
          <div className="flex flex-col gap-3 text-sm text-black/70 dark:text-white/70">
            <p className="text-base text-black dark:text-white font-semibold mb-3">
              What we'll access:
            </p>
            <p>• Modify /etc/hosts file</p>
            <p>• Restart DNS services</p>
            <p>• Block and unblock websites</p>
          </div>
          <p className="text-sm text-black/60 dark:text-white/60 mt-4">
            You'll authenticate once. We never store your password.
          </p>
        </div>
        {error && (
          <div className="w-full px-6 py-4 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        )}
        <div className="flex items-center gap-4 w-full justify-center mt-2">
          <button
            onClick={onPrev}
            disabled={isAuthorizing}
            className="px-8 py-3.5 text-sm font-semibold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={handleGrantAccess}
            disabled={isAuthorizing}
            className="px-10 py-3.5 text-sm font-semibold rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-40 min-w-[160px]"
          >
            {isAuthorizing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                Authorizing
              </span>
            ) : (
              "Grant Access"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
