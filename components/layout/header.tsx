"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useSidebarStore } from "@/store/sidebar-store";
import { SearchCommand } from "@/components/search/search-command";

export function Header() {
  const pathname = usePathname();
  const { toggleMobile } = useSidebarStore();

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [
      { label: "Dashboard", href: "/" },
    ];

    if (segments[0] === "semester") {
      crumbs.push({ label: "Semester", href: "/semester" });
    }
    if (segments[0] === "kalender") {
      crumbs.push({ label: "Kalender Tugas", href: "/kalender" });
    }
    if (segments[0] === "search") {
      crumbs.push({ label: "Pencarian", href: "/search" });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 flex items-center h-14 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9 mr-2 cursor-pointer"
        onClick={toggleMobile}
        aria-label="Buka menu navigasi"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <Link
              href={crumb.href}
              className={
                i === breadcrumbs.length - 1
                  ? "font-medium truncate"
                  : "text-muted-foreground hover:text-foreground truncate"
              }
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        <SearchCommand />
        <ThemeToggle />
      </div>
    </header>
  );
}
