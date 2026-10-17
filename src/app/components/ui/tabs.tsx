"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Segmented control: one hairline box, cells divided by ink rules.
        "inline-flex w-fit items-stretch rounded-sm border border-ink bg-transparent p-0 text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Inactive: soft text. Hover: tint + ink text. Selected: filled ink. Focus: inset ink outline.
        "inline-flex flex-1 items-center justify-center gap-1.5 border-r border-ink px-2 py-2 text-sm font-medium whitespace-nowrap text-ink-soft transition-colors duration-150 motion-reduce:transition-none last:border-r-0 hover:bg-zinc-100 hover:text-ink data-[state=active]:bg-ink data-[state=active]:text-paper outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--focus)] data-[state=active]:focus-visible:outline-[var(--paper)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
