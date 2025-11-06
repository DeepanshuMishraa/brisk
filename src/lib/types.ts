export interface Tag {
  id: string;
  label: string;
  type: "website" | "app";
  executable?: string;
  icon?: string;
}

export interface InstalledApp {
  name: string;
  display_name: string;
  executable: string;
  icon: string | null;
  categories: string[];
}
