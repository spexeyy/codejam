import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-(--width) items-start gap-3 rounded-control border border-border bg-surface p-4 text-body text-fg shadow-float",
          title: "font-medium",
          description: "text-fg-2",
          error: "[&_svg]:text-bad",
          success: "[&_svg]:text-ok",
        },
      }}
    />
  );
}
