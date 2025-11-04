export interface Tag {
  id: string;
  label: string;
  type: 'website' | 'app';
  executable?: string; // For apps only
}

export interface InstalledApp {
  name: string;
  display_name: string;
  executable: string;
  icon: string | null;
  categories: string[];
}
