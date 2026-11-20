import { cn } from "@/lib/utils";
import { Bold, Code, Heading2, Italic, List, ListOrdered } from "lucide-react";
import { useRef } from "react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

type ExecCommand = "bold" | "italic" | "formatBlock" | "insertUnorderedList" | "insertOrderedList";

interface ToolbarAction {
  label: string;
  icon: React.ElementType;
  command: ExecCommand;
  value?: string;
}

const TOOLBAR: ToolbarAction[] = [
  { label: "Bold", icon: Bold, command: "bold" },
  { label: "Italic", icon: Italic, command: "italic" },
  { label: "Heading", icon: Heading2, command: "formatBlock", value: "h2" },
  { label: "Bullet List", icon: List, command: "insertUnorderedList" },
  { label: "Numbered List", icon: ListOrdered, command: "insertOrderedList" },
  { label: "Code", icon: Code, command: "formatBlock", value: "pre" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  minHeight = "120px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  function exec(command: ExecCommand, val?: string) {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
  }

  function handleInput() {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  return (
    <div className={cn("rounded-md border border-input bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-input px-2 py-1.5">
        {TOOLBAR.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(t.command, t.value);
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <t.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Content area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={cn(
          "px-3 py-2 text-sm outline-none prose prose-sm max-w-none",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
        )}
        dangerouslySetInnerHTML={value ? { __html: value } : undefined}
      />
    </div>
  );
}
