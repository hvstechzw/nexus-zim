// Compatibility shim — the legacy NexusHeader is now a thin alias around
// NashHeader so every page that still imports NexusHeader gets the NASH
// green/gold lockup and role-aware nav without each page being touched.
// Don't add new features here; add them to NashHeader.
import { NashHeader } from "@/components/nash/NashHeader";

export function NexusHeader() {
  return <NashHeader />;
}

export default NexusHeader;
