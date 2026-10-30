import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "./cn.ts";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-on-accent hover:bg-accent-text",
        secondary:
          "border border-border bg-surface text-fg shadow-card hover:bg-subtle",
        ghost: "text-fg-2 hover:bg-fill hover:text-fg",
      },
      size: {
        default: "h-control px-3.5 text-body",
        sm: "h-8 px-2.5 text-label",
        icon: "size-control",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
