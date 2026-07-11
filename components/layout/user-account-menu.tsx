"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UserAccountMenuProps = {
  align?: "left" | "right";
  compact?: boolean;
  user: {
    email: string;
    id: string;
    image?: string | null;
    name: string;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function UserAvatar({
  className,
  image,
  name,
}: {
  className?: string;
  image?: string | null;
  name: string;
}) {
  if (image) {
    return (
      <img
        alt={name}
        className={cn(
          "size-10 rounded-2xl border border-border/70 object-cover",
          className,
        )}
        referrerPolicy="no-referrer"
        src={image}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-muted/70 text-xs font-semibold tracking-[0.18em] text-foreground",
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function UserAccountMenu({
  align = "left",
  compact = false,
  user,
}: UserAccountMenuProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSignOut = () => {
    setError(null);

    startTransition(() => {
      void authClient.signOut(undefined, {
        onError: ({ error }: { error: { message: string } }) => {
          setError(error.message);
        },
        onSuccess: () => {
          setIsOpen(false);
          router.replace("/sign-in");
          router.refresh();
        },
      });
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-border/70 bg-background/90 px-3 py-2 text-left shadow-sm transition hover:border-foreground/20 hover:bg-background",
          compact && "px-2.5 py-2",
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <UserAvatar image={user.image} name={user.name} />

        {!compact ? (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={cn(
            "absolute z-50 mt-2 w-72 rounded-[1.5rem] border border-border/70 bg-background/95 p-3 shadow-xl backdrop-blur",
            align === "right" ? "right-0" : "left-0",
          )}
          role="menu"
        >
          <div className="rounded-[1.25rem] border border-border/70 bg-muted/35 p-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              User {user.id.slice(0, 8)}
            </p>
          </div>

          <div className="mt-3 grid gap-2">
            <Button
              asChild
              className="justify-start rounded-2xl"
              onClick={() => setIsOpen(false)}
              variant="ghost"
            >
              <Link href="/profile">
                <UserRound className="size-4" />
                Profile
              </Link>
            </Button>

            <Button
              asChild
              className="justify-start rounded-2xl"
              onClick={() => setIsOpen(false)}
              variant="ghost"
            >
              <Link href="/settings">
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>

            <Button
              className="justify-start rounded-2xl"
              disabled={isPending}
              onClick={handleSignOut}
              variant="outline"
            >
              <LogOut className="size-4" />
              {isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
