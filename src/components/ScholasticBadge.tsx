interface ScholasticBadgeProps {
  size?: "sm" | "md" | "lg";
  showLink?: boolean;
  className?: string;
}

export function ScholasticBadge({ size = "sm", showLink = true, className = "" }: ScholasticBadgeProps) {
  const sizeMap = {
    sm: "text-[9px] px-2.5 py-1 gap-1.5",
    md: "text-[10px] px-3 py-1.5 gap-2",
    lg: "text-xs px-4 py-2 gap-2.5",
  };

  const dotSize = { sm: "w-1.5 h-1.5", md: "w-2 h-2", lg: "w-2.5 h-2.5" };

  const content = (
    <span className={`inline-flex items-center ${sizeMap[size]} mono tracking-wider uppercase font-semibold rounded-full hairline bg-nexus-surface text-nexus-muted hover:text-foreground transition-colors ${className}`}>
      <span className={`${dotSize[size]} rounded-full bg-emerald-500 flex-shrink-0`} />
      Scholastic Services Verified
    </span>
  );

  if (showLink) {
    return (
      <a href="https://scholasticservices.online" target="_blank" rel="noopener noreferrer" className="inline-block">
        {content}
      </a>
    );
  }

  return content;
}

export function ScholasticIntegrationBanner() {
  return (
    <div className="hairline rounded-xl p-4 sm:p-5 bg-nexus-surface/50 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Exclusively connected to Scholastic Services</p>
          <p className="text-[10px] text-nexus-muted mt-0.5">School vetting, student registration & sports tracking</p>
        </div>
      </div>
      <a
        href="https://scholasticservices.online"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex-shrink-0 h-7 px-3 text-[10px] font-semibold tracking-wide rounded-lg bg-foreground text-primary-foreground hover:opacity-85 transition-opacity inline-flex items-center gap-1.5"
      >
        scholasticservices.online
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
