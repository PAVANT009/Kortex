import { Palette, ShieldCheck, SlidersHorizontal } from "lucide-react";

const settingsSections = [
  {
    description:
      "Theme selection already works in the shared shell and will expand into persisted appearance preferences.",
    icon: Palette,
    title: "Appearance",
  },
  {
    description:
      "Risk tolerance, investment horizon, market focus, and AI detail level will shape prompt inputs in later phases.",
    icon: SlidersHorizontal,
    title: "Research Preferences",
  },
  {
    description:
      "Account actions and provider visibility will live here once the auth surface expands beyond the current setup.",
    icon: ShieldCheck,
    title: "Account Controls",
  },
] as const;

export default function SettingsPage() {
  return (
    <section className="grid gap-4 xl:grid-cols-3">
      {settingsSections.map((section) => {
        const Icon = section.icon;

        return (
          <article
            className="rounded-[1.8rem] border border-border/70 bg-background/90 p-6 shadow-sm"
            key={section.title}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/45 text-foreground">
              <Icon className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {section.description}
            </p>
          </article>
        );
      })}
    </section>
  );
}
