import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input, Button } from "reactstrap";

// --- Reusable Autocomplete Textarea using Reactstrap <Input type="textarea" /> ---
export interface IAutocompleteTextarea {
  value?: string;
  placeholder?: string;
  suggestions?: string[]; // the full suggestion dictionary
  maxSuggestions?: number; // max items to show in dropdown
  minTriggerChars?: number; // minimum chars of the current token to start suggesting
  onChange: (value: string) => void;
  onSubmit: (value: string) => void; // trigger when ctrl+enter pressed
  className?: string;
}

export const AutocompleteTextarea = (props: IAutocompleteTextarea): JSX.Element => {
  const {
    value = "",
    placeholder = "Type here…",
    suggestions = [],
    maxSuggestions = 6,
    minTriggerChars = 2,
    onChange,
    onSubmit,
    className = "",
  } = props;

  const [text, setText] = useState<string>(value);
  const [open, setOpen] = useState<boolean>(false);
  const [highlight, setHighlight] = useState<number>(0);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [caret, setCaret] = useState<number>(value.length);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Keep internal state in sync if parent controls `value`
  useEffect(() => {
    setText(value ?? "");
    // if parent overwrites value, try to maintain caret at end
    setCaret(Math.min(caret, (value ?? "").length));
  }, [value]);

  // --- caret-aware token extraction ---
  const { token, start, end } = useMemo(() => {
    const pos = caret;
    const left = text.slice(0, pos);
    const right = text.slice(pos);

    const leftMatch = left.match(/(\{[\w:-]+)$/); // token chars before caret
    const rightMatch = right.match(/^\{([\w:-]+)/); // token chars after caret (if caret is in middle)

    const leftLen = leftMatch ? leftMatch[1].length : 0;
    const rightLen = rightMatch ? rightMatch[1].length : 0;

    const tokenStart = pos - leftLen;
    const tokenEnd = pos + rightLen;
    const tok = text.slice(tokenStart, tokenEnd);
    return { token: tok, start: tokenStart, end: tokenEnd };
  }, [text, caret]);

  useEffect(() => {
    const t = token.trim();
    if (t.length >= minTriggerChars) {
      const lower = t.toLowerCase();
      const uniq = Array.from(new Set(suggestions));
      const list = uniq
        // prefix match first, then fallback to includes
        .filter((s) => s.toLowerCase().startsWith(lower) || s.toLowerCase().includes(lower))
        .slice(0, maxSuggestions);
      setFiltered(list);
      setOpen(list.length > 0);
      setHighlight(0);
    } else {
      setOpen(false);
      setFiltered([]);
    }
  }, [token, suggestions, maxSuggestions, minTriggerChars]);

  const replaceCurrentToken = (completion: string) => {
    const before = text.slice(0, start);
    const after = text.slice(end);
    const next = `${before}${completion}${after}`;
    const nextCaret = before.length + completion.length;
    setText(next);
    onChange(next);

    // Refocus the textarea and restore caret after Reactstrap re-render
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.selectionStart = ta.selectionEnd = nextCaret;
      setCaret(nextCaret);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit(text);
      return;
    }
    if (!open || filtered.length === 0) return; // nothing to do for navigation/acceptance
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Tab" || (e.key === "Enter" && !(e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      const choice = filtered[highlight] ?? filtered[0];
      if (choice) replaceCurrentToken(choice);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = e.target.value;
    setText(next);
    onChange(next);
    const el = textareaRef.current;
    if (el) setCaret(el.selectionStart ?? next.length);
  };

  const handleSelect = () => {
    const el = textareaRef.current;
    if (!el) return;
    setCaret(el.selectionStart ?? 0);
  };

  const handleClickSuggestion = (s: string) => {
    replaceCurrentToken(s);
    setOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (
        listRef.current && !listRef.current.contains(ev.target as Node) &&
        textareaRef.current && !textareaRef.current.contains(ev.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className={`relative w-full h-100`}>
      <Input
        type="textarea"
        innerRef={(el) => {
          // Reactstrap's Input exposes the DOM node via innerRef
          textareaRef.current = (el as unknown as HTMLTextAreaElement) || null;
        }}
        style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.25rem', backgroundColor: '#2a292f', color: '#b8c6d4ff' }}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleSelect}
        onClick={handleSelect}
        onSelect={handleSelect}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`w-full h-40 resize-y rounded-2xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${className}`}
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 mt-2 max-h-64 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl z-50"
        >
          {filtered.map((s, i) => (
            <button
              key={`${s}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep focus in textarea
              onClick={() => handleClickSuggestion(s)}
              className={`block w-full text-left px-3 py-2 hover:bg-gray-100 ${
                i === highlight ? "bg-gray-100" : "bg-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};