/** @format */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAppPreferences } from "@/lib/app-preferences";

type NavItem = { href: string; label: string };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function NavLink({ href, label, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative isolate inline-flex items-center justify-center overflow-visible",
        "h-9 px-4 rounded-full text-sm font-medium",
        "transition-[color,background-color] duration-300 ease-out",
        "text-muted-foreground hover:text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring/30",
        active && "text-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-full",
          "transition-opacity duration-500 ease-out",
          "bg-primary/10",
          active
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-0.5 left-2 right-2 h-0.5 origin-center rounded-full",
          "transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,.61,.36,1)]",
          "bg-primary",
          active
            ? "scale-x-100 opacity-100"
            : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100 group-active:scale-x-100 group-active:opacity-100",
        )}
      />
      {label}
    </Link>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const { language, setLanguage, theme, toggleTheme } = useAppPreferences();

  const text =
    language === "id"
      ? {
          dashboard: "Dashboard",
          transaction: "Transaksi",
          emergency: "Darurat",
          subtitle: "Kebiasaan uang AI",
          demoMode: "Mode demo",
          demoHint: "Login/logout & pengaturan profil bisa kamu tambah nanti.",
          close: "Tutup",
          profile: "Profil",
          settings: "Pengaturan",
          logout: "Keluar",
          userName: "Pengguna Demo",
          lang: "Bahasa",
          theme: "Tema",
          dark: "Gelap",
          light: "Terang",
        }
      : {
          dashboard: "Dashboard",
          transaction: "Transaction",
          emergency: "Emergency",
          subtitle: "AI money habits",
          demoMode: "Demo mode",
          demoHint: "You can add login/logout & profile settings later.",
          close: "Close",
          profile: "Profile",
          settings: "Settings",
          logout: "Logout",
          userName: "Demo User",
          lang: "Language",
          theme: "Theme",
          dark: "Dark",
          light: "Light",
        };

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: "/dashboard", label: text.dashboard },
      { href: "/transaction", label: text.transaction },
      { href: "/withdraw-emergency", label: text.emergency },
    ],
    [text.dashboard, text.emergency, text.transaction],
  );

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b bg-background/75 backdrop-blur supports-backdrop-filter:bg-background/55">
        {/* === MOBILE BAR ( < md ) === */}
        <div className="md:hidden mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0 rounded-2xl",
                    "transition hover:bg-muted/60",
                  )}
                  aria-label="Open menu"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7h16M4 12h16M4 17h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className={cn(
                  "flex h-full w-[320px] flex-col sm:w-90",
                  "bg-background/95 backdrop-blur-xl",
                  "border-r",
                )}
              >
                <SheetHeader className="space-y-1">
                  <SheetTitle className="tracking-tight">Piggybank</SheetTitle>
                  <div className="text-xs text-muted-foreground">
                    {text.subtitle} • {text.demoMode.toLowerCase()}
                  </div>
                </SheetHeader>

                <Separator className="my-4" />

                <nav className="space-y-1.5">
                  {navItems.map((it) => {
                    const active = pathname === it.href;
                    return (
                      <SheetClose asChild key={it.href}>
                        <Link
                          href={it.href}
                          className={cn(
                            "group relative flex items-center rounded-xl px-3 py-2.5 text-sm overflow-visible",
                            "transition-[color,background-color] duration-300 ease-out",
                            "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring/30",
                            active && "bg-muted/70 font-medium text-foreground",
                          )}
                        >
                          <span>{it.label}</span>
                          <span
                            aria-hidden
                            className={cn(
                              "pointer-events-none absolute bottom-1.5 left-3 right-3 h-0.5 origin-center rounded-full bg-primary",
                              "transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,.61,.36,1)]",
                              active
                                ? "scale-x-100 opacity-100"
                                : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100 group-active:scale-x-100 group-active:opacity-100",
                            )}
                          />
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>

                <div className="mt-4 space-y-4">
                  <Separator />

                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="text-sm font-medium">{text.demoMode}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {text.demoHint}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {text.lang}
                      </span>
                      <div className="inline-flex rounded-lg border p-0.5">
                        <button
                          type="button"
                          onClick={() => setLanguage("en")}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs",
                            language === "en" &&
                              "bg-primary/15 text-foreground",
                          )}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage("id")}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs",
                            language === "id" &&
                              "bg-primary/15 text-foreground",
                          )}
                        >
                          ID
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {text.theme}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg px-2 text-xs"
                        onClick={toggleTheme}
                      >
                        {theme === "dark" ? text.dark : text.light}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full rounded-xl">
                      {text.close}
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>

            {/* Center: compact brand */}
            <Link
              href="/dashboard"
              className={cn(
                "min-w-0 flex items-center gap-2 rounded-2xl px-2 py-1",
                "transition hover:bg-muted/60",
              )}
              aria-label="Go to dashboard"
            >
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-2xl border",
                  "bg-linear-to-b from-primary/15 to-transparent",
                  "shadow-[0_10px_28px_hsl(var(--primary)/0.12)]",
                )}
              >
                <span className="text-sm font-black tracking-tight">PB</span>
              </span>

              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-bold tracking-tight">
                  Piggybank
                </div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {text.subtitle}
                </div>
              </div>
            </Link>

            {/* Right: profile (icon only) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center justify-center rounded-2xl border",
                    "h-10 w-10 bg-background/40 backdrop-blur",
                    "transition hover:bg-muted/60",
                    "focus:outline-none focus:ring-2 focus:ring-ring/30",
                  )}
                  aria-label="Open profile menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">DU</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/profile">{text.profile}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">{text.settings}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    alert(
                      language === "id"
                        ? "Mode demo: login/logout akan ditambahkan nanti"
                        : "Demo mode: login/logout will be added later",
                    )
                  }
                >
                  {text.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* === DESKTOP BAR ( >= md ) === */}
        <div className="hidden md:block">
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
            {/* LEFT: brand */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/dashboard"
                className={cn(
                  "group flex items-center gap-2 rounded-2xl px-2 py-1 min-w-0",
                  "transition hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-2xl border shrink-0",
                    "bg-linear-to-b from-primary/15 to-transparent",
                    "shadow-[0_10px_28px_hsl(var(--primary)/0.12)]",
                  )}
                >
                  <span className="text-sm font-black tracking-tight">PB</span>
                </span>

                <div className="min-w-0 leading-tight">
                  <div className="truncate text-base font-bold tracking-tight">
                    Piggybank
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground -mt-0.5">
                    {text.subtitle}
                  </div>
                </div>
              </Link>
            </div>

            {/* CENTER: floating pill nav */}
            <div className="flex justify-center">
              <div
                className={cn(
                  "relative flex items-center gap-1 rounded-full px-1.5 py-1",
                  "border bg-background/60 backdrop-blur-md",
                  "shadow-[0_12px_34px_rgba(0,0,0,0.06)]",
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-white/40 to-transparent dark:from-white/10"
                />
                {navItems.map((it) => {
                  const active = pathname === it.href;
                  return <NavLink key={it.href} {...it} active={active} />;
                })}
              </div>
            </div>

            {/* RIGHT: profile full */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border p-0.5">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      language === "en" && "bg-primary/15",
                    )}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("id")}
                    className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      language === "id" && "bg-primary/15",
                    )}
                  >
                    ID
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-full px-3 text-xs"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? text.dark : text.light}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "group flex items-center gap-2 rounded-full border px-2 py-1",
                        "bg-background/40 backdrop-blur",
                        "transition hover:bg-muted/60",
                        "focus:outline-none focus:ring-2 focus:ring-ring/30",
                      )}
                      aria-label="Open profile menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">DU</AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:block text-left leading-tight pr-1">
                        <div className="text-sm font-medium">
                          {text.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          demo@aipiggybank.local
                        </div>
                      </div>
                      <span className="hidden sm:inline text-muted-foreground group-hover:text-foreground transition">
                        ▾
                      </span>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">{text.profile}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">{text.settings}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        alert(
                          language === "id"
                            ? "Mode demo: login/logout akan ditambahkan nanti"
                            : "Demo mode: login/logout will be added later",
                        )
                      }
                    >
                      {text.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
