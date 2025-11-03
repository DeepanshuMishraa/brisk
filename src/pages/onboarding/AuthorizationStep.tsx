import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
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
          : "Authorization failed. Please try again or check your password."
      );
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-8 min-h-0">
      <div className="mb-6">
        <ShieldCheck className="h-16 w-16 text-gray-900 dark:text-white" strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-4">
        System Authorization
      </h1>
      <div className="text-gray-600 dark:text-gray-400 text-base mb-6 max-w-md space-y-3">
        <p>
          Focus needs to modify system files to block websites.
        </p>
        <p>
          You'll be asked for your password once to set this up.
        </p>
        <p className="font-medium text-gray-900 dark:text-white">
          After this, you won't need to enter it again.
        </p>
      </div>
      <div className="mb-6 w-full max-w-md border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-left">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              What this allows:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>? Modify /etc/hosts file</li>
              <li>? Restart DNS services</li>
              <li>? Block/unblock websites</li>
            </ul>
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-6 w-full max-w-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}
      <div className="flex items-center gap-4">
        <Button
          onClick={onPrev}
          disabled={isAuthorizing}
          variant="ghost"
          className="px-6 py-6 text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleGrantAccess}
          disabled={isAuthorizing}
          className="px-8 py-6 text-base bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 border-0 disabled:opacity-50"
        >
          {isAuthorizing ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              Authorizing...
            </>
          ) : (
            <>
              Grant Access
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
