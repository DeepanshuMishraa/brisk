import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PermissionState {
  hasPermission: boolean;
  permissionAsked: boolean;
  setHasPermission: (value: boolean) => void;
  setPermissionAsked: (value: boolean) => void;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set) => ({
      hasPermission: false,
      permissionAsked: false,
      setHasPermission: (value: boolean) => set({ hasPermission: value }),
      setPermissionAsked: (value: boolean) => set({ permissionAsked: value }),
    }),
    {
      name: "focus-permissions",
    }
  )
);

