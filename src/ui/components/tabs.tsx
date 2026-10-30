import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "./cn.ts";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-control items-center gap-2 rounded-control px-3 text-body text-fg-2 transition-colors hover:bg-subtle hover:text-fg data-[state=active]:bg-accent-soft data-[state=active]:font-medium data-[state=active]:text-accent-text [&_svg]:size-4 [&_svg]:text-fg-3 data-[state=active]:[&_svg]:text-accent-text",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn(className)} {...props} />;
}
