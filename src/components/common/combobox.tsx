"use client";

import { Check, ChevronsUpDown, LoaderIcon, Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

/**
 * A searchable, paginated select.
 *
 * It takes a `searchFn` rather than an options array, because the lists worth
 * a combobox are the ones too long to hold in a `<Select>` — members, orgs,
 * anything server-side. Typing debounces into `searchFn(query, offset, size)`;
 * "Load more" pages with the same call.
 *
 * `valueKey` names the field that identifies an option. Everything —
 * selection, the tick mark, the load-more cursor — compares on it, so `T` can
 * be any shape as long as one field is stable.
 */

interface BaseProps<T extends object> {
  /** Placeholder shown while nothing is selected. */
  title?: string;
  /** The field that identifies an option, e.g. `"id"`. */
  valueKey: keyof T;
  disabled?: boolean;
  /** Page size for `searchFn`. */
  size?: number;
  renderText: (value: T) => string;
  searchFn: (search: string, offset: number, size: number) => Promise<T[]>;
  /** Adds a "Create new" row at the top of the list. */
  onCreateClick?: () => void;
  /** Adds a pencil button to each row. */
  onEditClick?: (item: T) => void;
  createLabel?: string;
  emptyLabel?: string;
  className?: string;
}

type MultipleProps<T extends object> = BaseProps<T> & {
  multiple: true;
  value?: T[];
  onChange?: (value: T[]) => void;
};

type SingleProps<T extends object> = BaseProps<T> & {
  multiple?: false;
  value?: T | null;
  onChange?: (value: T) => void;
};

export type ComboBoxProps<T extends object> = MultipleProps<T> | SingleProps<T>;

export function ComboBox<T extends object>(props: ComboBoxProps<T>) {
  const {
    title = "Select…",
    valueKey,
    disabled = false,
    size = 25,
    renderText,
    searchFn,
    onCreateClick,
    onEditClick,
    createLabel = "Create new",
    emptyLabel = "No item found.",
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<T[]>([]);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 500);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await searchFn(debouncedSearch, 0, size);
      setOptions(results);
      setCanLoadMore(results.length === size);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, searchFn, size]);

  const loadNextPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await searchFn(debouncedSearch, options.length, size);
      // Guard against a `searchFn` that ignores the offset and keeps
      // returning page one — otherwise "Load more" appends duplicates forever.
      const seen = new Set(options.map((o) => String(o[valueKey])));
      const fresh = results.filter((r) => !seen.has(String(r[valueKey])));
      setOptions((prev) => [...prev, ...fresh]);
      setCanLoadMore(fresh.length > 0 && results.length === size);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, searchFn, options, valueKey, size]);

  // Only fetch while the popover is open: a form with six comboboxes should
  // not fire six queries on mount.
  useEffect(() => {
    if (!open) return;
    loadFirstPage();
  }, [open, loadFirstPage]);

  const isSelected = (option: T) => {
    if (props.multiple) {
      return (props.value ?? []).some((v) => v[valueKey] === option[valueKey]);
    }
    return props.value != null && props.value[valueKey] === option[valueKey];
  };

  const handleSelect = (option: T) => {
    if (props.multiple) {
      const current = props.value ?? [];
      const exists = current.some((v) => v[valueKey] === option[valueKey]);
      props.onChange?.(
        exists ? current.filter((v) => v[valueKey] !== option[valueKey]) : [...current, option]
      );
      // Stay open: picking several is the whole point of multiple.
      return;
    }
    props.onChange?.(option);
    setOpen(false);
  };

  const hasValue = props.multiple ? (props.value?.length ?? 0) > 0 : props.value != null;

  const label = props.multiple
    ? hasValue
      ? props.value!.map(renderText).join(", ")
      : title
    : props.value
      ? renderText(props.value)
      : title;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !hasValue && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        {/* `shouldFilter={false}` — filtering is the server's job here. */}
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search…" value={search} onValueChange={setSearch} />
          <CommandList>
            {!isLoading && options.length === 0 && <CommandEmpty>{emptyLabel}</CommandEmpty>}

            <CommandGroup className="max-h-60 overflow-y-auto">
              {onCreateClick && (
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    onCreateClick();
                  }}
                  className="text-primary gap-2"
                >
                  <Plus className="size-4" />
                  {createLabel}
                </CommandItem>
              )}

              {options.map((option) => (
                <CommandItem
                  key={String(option[valueKey])}
                  value={String(option[valueKey])}
                  onSelect={() => handleSelect(option)}
                  className="group justify-between"
                >
                  <span className="flex min-w-0 items-center">
                    <Check
                      className={cn(
                        "mr-2 size-4 shrink-0",
                        isSelected(option) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{renderText(option)}</span>
                  </span>

                  {onEditClick && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 size-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                        onEditClick(option);
                      }}
                    >
                      <Pencil className="size-3" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  )}
                </CommandItem>
              ))}

              {/* cmdk, not Base UI — `CommandItem` still takes `asChild`. */}
              {canLoadMore && options.length > 0 && (
                <CommandItem asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full"
                    onClick={loadNextPage}
                    disabled={isLoading}
                  >
                    {isLoading ? <LoaderIcon className="size-4 animate-spin" /> : "Load more ↓"}
                  </Button>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ComboBox;
