import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  eyebrow: string;
  title: string;
};

export function AppEmptyState({
  actionHref,
  actionLabel,
  description,
  eyebrow,
  title,
}: AppEmptyStateProps) {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-background/90 p-8 shadow-sm">
      <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
        {description}
      </p>

      {actionHref && actionLabel ? (
        <div className="mt-6">
          <Button asChild className="rounded-full px-4">
            <Link href={actionHref}>
              {actionLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
