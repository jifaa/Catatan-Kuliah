"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  ChevronRight,
  BookOpen,
  CalendarDays,
  Search,
  Plus,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSidebarStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";
import type { SidebarSemester } from "@/types";

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggle, expandedSemesters, toggleSemester, setMobileOpen } = useSidebarStore();
  const [semesters, setSemesters] = useState<SidebarSemester[]>([]);

  useEffect(() => {
    fetch("/api/semesters?include=subjects")
      .then((res) => res.json())
      .then((data) => setSemesters(data))
      .catch(() => {});
  }, [pathname]);

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/semester", label: "Semester", icon: GraduationCap },
    { href: "/kalender", label: "Kalender & Jadwal", icon: CalendarDays },
    { href: "/search", label: "Pencarian", icon: Search },
  ];

  const effectiveCollapsed = isMobile ? false : isCollapsed;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out z-30",
        isMobile
          ? "w-full h-full border-r-0"
          : cn("hidden md:flex h-screen sticky top-0", effectiveCollapsed ? "w-16" : "w-64")
      )}
    >
      {/* Header */}
      <div className="flex items-center h-14 px-3 border-b border-border">
        {(!effectiveCollapsed || isMobile) && (
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-2 font-semibold text-sm flex-1"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Catatan Kuliah</span>
          </Link>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 shrink-0 cursor-pointer"
          >
            {effectiveCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-2">
        {/* Main Nav */}
        <div className="px-2 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent",
                pathname === item.href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground",
                effectiveCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!effectiveCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {!effectiveCollapsed && (
          <>
            <Separator className="my-3" />

            {/* Semesters Tree */}
            <div className="px-2">
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Semester
                </span>
                <Link href="/semester" onClick={handleLinkClick}>
                  <Button variant="ghost" size="icon" className="h-5 w-5 cursor-pointer">
                    <Plus className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-0.5">
                {Array.isArray(semesters) && semesters.map((semester) => (
                  <div key={semester.id}>
                    <div className="group flex items-center gap-1">
                      <Link
                        href={`/semester/${semester.id}`}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-2 min-w-0 flex-1 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
                          pathname.startsWith(`/semester/${semester.id}`)
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{semester.name}</span>
                      </Link>

                      <Link href={`/semester/${semester.id}`} onClick={handleLinkClick}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 cursor-pointer text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label={`Tambah mata kuliah untuk ${semester.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSemester(semester.id)}
                        className="h-6 w-6 cursor-pointer text-muted-foreground"
                        aria-label={`Expand atau collapse ${semester.name}`}
                      >
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 shrink-0 transition-transform",
                            expandedSemesters.includes(semester.id) && "rotate-90"
                          )}
                        />
                      </Button>
                    </div>

                    {expandedSemesters.includes(semester.id) && (
                      <div className="ml-5 pl-3 border-l border-border space-y-0.5 mt-0.5">
                        {semester.subjects.map((subject) => (
                          <Link
                            key={subject.id}
                            href={`/semester/${semester.id}/matakuliah/${subject.id}`}
                            onClick={handleLinkClick}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
                              pathname.includes(subject.id)
                                ? "text-foreground font-medium bg-accent/50"
                                : "text-muted-foreground"
                            )}
                          >
                            <BookOpen className="h-3 w-3 shrink-0" />
                            <span className="truncate">{subject.title}</span>
                          </Link>
                        ))}
                        {semester.subjects.length === 0 && (
                          <p className="px-3 py-1.5 text-xs text-muted-foreground/60 italic">
                            Belum ada mata kuliah
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {Array.isArray(semesters) && semesters.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground/60 italic">
                    Belum ada semester
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </ScrollArea>
    </aside>
  );
}
