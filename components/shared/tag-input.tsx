"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TAG_COLORS } from "@/lib/constants";
import type { TagData } from "@/types";

interface TagInputProps {
  selectedTags: TagData[];
  onChange: (tags: TagData[]) => void;
}

export function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setAllTags)
      .catch(() => {});
  }, []);

  const filteredTags = allTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedTags.find((t) => t.id === tag.id)
  );

  const addTag = (tag: TagData) => {
    onChange([...selectedTags, tag]);
    setSearch("");
  };

  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const createTag = async () => {
    if (!search.trim()) return;

    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: search.trim(), color }),
      });
      const tag = await res.json();
      setAllTags((prev) => [...prev, tag]);
      addTag(tag);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 pr-1 text-xs"
            style={{
              backgroundColor: tag.color + "20",
              color: tag.color,
              borderColor: tag.color + "40",
            }}
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 cursor-pointer"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs gap-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <Input
              ref={inputRef}
              placeholder="Cari atau buat tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm mb-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim() && filteredTags.length === 0) {
                  createTag();
                }
              }}
            />
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-accent cursor-pointer"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
              {search.trim() && filteredTags.length === 0 && (
                <button
                  onClick={createTag}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-accent text-primary cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Buat &ldquo;{search}&rdquo;
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
