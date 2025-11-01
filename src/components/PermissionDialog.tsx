import { Shield, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

interface PermissionDialogProps {
  onGrant: () => void;
  onDeny: () => void;
}

export function PermissionDialog({ onGrant, onDeny }: PermissionDialogProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleGrant = async () => {
    setIsAuthorizing(true);
    try {
      await invoke<string>("authorize_admin");
      onGrant();
    } catch (error) {
      alert(`Authorization failed: ${error}\n\nYou can still use the app, but you'll be prompted for your password when blocking sites.`);
      onGrant();
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-black/90 border border-white/20 rounded-lg shadow-2xl p-6 backdrop-blur-xl">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
              <Shield className="size-16 text-blue-400 relative z-10" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Permission Required
          </h2>
          <p className="text-gray-300 text-center mb-6 text-sm leading-relaxed">
            Focus needs administrator privileges to block distracting websites by modifying your system's hosts file.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lock className="size-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium mb-1">
                  What this permission allows:
                </p>
                <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                  <li>Block websites during focus sessions</li>
                  <li>Unblock websites when sessions end</li>
                  <li>Modify system hosts file (requires sudo)</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="size-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-xs">
              You'll be prompted for your password once when granting permission. After that, you won't be asked again for 15 minutes.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onDeny}
              variant="ghost"
              className={cn(
                "flex-1 border border-white/10 text-gray-300 hover:text-white",
                "hover:bg-white/5"
              )}
            >
              Deny
            </Button>
            <Button
              onClick={handleGrant}
              disabled={isAuthorizing}
              className={cn(
                "flex-1 bg-blue-500 hover:bg-blue-600 text-white",
                "border-0 shadow-lg shadow-blue-500/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isAuthorizing ? (
                <>
                  <div className="size-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Grant Permission
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

