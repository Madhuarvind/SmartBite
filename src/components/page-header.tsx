import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        {title}
      </h1>
      {action}
    </div>
  );
}
