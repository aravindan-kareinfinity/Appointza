import { LucideIcon } from "lucide-react";

interface SettingsEmbeddedHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  variant?: "gradient" | "plain";
}

/** Profile/settings tabs already name the section in the sidebar — no page heading. */
const SettingsEmbeddedHeader = (_props: SettingsEmbeddedHeaderProps) => null;

export default SettingsEmbeddedHeader;
