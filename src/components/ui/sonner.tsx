import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * One toast region, top centre, 4s (§9.7). State pairs come from the shared
 * state tokens; every toast carries an icon from sonner and a word-led title.
 */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    position="top-center"
    duration={4000}
    visibleToasts={1}
    className="toaster group"
    style={{ zIndex: 110 }}
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
        description: "group-[.toast]:text-supporting",
        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:min-h-11",
        cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-foreground group-[.toast]:min-h-11",
        success: "group-[.toaster]:!bg-success-bg group-[.toaster]:!text-success",
        error: "group-[.toaster]:!bg-danger-bg group-[.toaster]:!text-danger",
        warning: "group-[.toaster]:!bg-warning-bg group-[.toaster]:!text-warning",
        info: "group-[.toaster]:!bg-info-bg group-[.toaster]:!text-info",
      },
    }}
    {...props}
  />
);

export { Toaster, toast };
