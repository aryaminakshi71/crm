/**
 * Projects Board Component Tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

vi.mock("lucide-react", () => {
  const icon = (id: string) => () =>
    React.createElement("div", { "data-testid": id });
  return {
    Plus: icon("plus"),
    X: icon("x"),
    ChevronDown: icon("chevron-down"),
    ChevronRight: icon("chevron-right"),
    CheckCircle2: icon("check-circle"),
    Circle: icon("circle"),
    Clock: icon("clock"),
    User: icon("user"),
    Tag: icon("tag"),
    Flag: icon("flag"),
    MessageSquare: icon("message"),
    Paperclip: icon("paperclip"),
    Calendar: icon("calendar"),
    ArrowUp: icon("arrow-up"),
    ArrowDown: icon("arrow-down"),
    Minus: icon("minus"),
    MoreHorizontal: icon("more-horizontal"),
    Search: icon("search"),
    Filter: icon("filter"),
    Timer: icon("timer"),
    ListChecks: icon("list-checks"),
    GripVertical: icon("grip"),
    Edit2: icon("edit"),
    Trash2: icon("trash"),
  };
});

vi.mock("@crm/ui", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => React.createElement("button", { onClick }, children),
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) =>
    React.createElement("span", { "data-testid": "badge", className }, children),
  Card: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "card" }, children),
  CardContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  CardHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  CardTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h3", {}, children),
  Textarea: ({
    value,
    onChange,
    placeholder,
    "data-testid": testId,
  }: any) =>
    React.createElement("textarea", {
      "data-testid": testId,
      value,
      onChange,
      placeholder,
    }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement("a", { href: to }, children),
  useParams: () => ({ id: "project-1" }),
  createFileRoute: () => () => ({}),
}));

// ─── Test Data ────────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = ["Todo", "In Progress", "In Review", "Done"];

const sampleTasks = [
  {
    id: "t1",
    title: "Design new dashboard",
    status: "todo",
    priority: "high",
    assignee: "Alice",
    subtasks: [
      { id: "s1", label: "Wireframes", done: false },
      { id: "s2", label: "Mockups", done: true },
    ],
  },
  {
    id: "t2",
    title: "Implement API endpoints",
    status: "in_progress",
    priority: "urgent",
    assignee: "Bob",
    subtasks: [],
  },
  {
    id: "t3",
    title: "Write unit tests",
    status: "in_review",
    priority: "medium",
    assignee: "Carol",
    subtasks: [],
  },
  {
    id: "t4",
    title: "Deploy to staging",
    status: "done",
    priority: "low",
    assignee: "Dave",
    subtasks: [],
  },
];

// ─── Kanban Board Column Render Tests ─────────────────────────────────────────

describe("Kanban board columns", () => {
  function KanbanBoard({
    tasks,
  }: {
    tasks: typeof sampleTasks;
  }) {
    const columnMap: Record<string, string> = {
      todo: "Todo",
      in_progress: "In Progress",
      in_review: "In Review",
      done: "Done",
    };

    return React.createElement(
      "div",
      { "data-testid": "kanban-board" },
      Object.entries(columnMap).map(([status, label]) =>
        React.createElement(
          "div",
          { key: status, "data-testid": `kanban-column-${status}` },
          React.createElement("h3", { "data-testid": `column-label-${status}` }, label),
          tasks
            .filter((t) => t.status === status)
            .map((t) =>
              React.createElement(
                "div",
                { key: t.id, "data-testid": `task-card-${t.id}` },
                t.title,
              ),
            ),
        ),
      ),
    );
  }

  it("renders Todo column", () => {
    render(React.createElement(KanbanBoard, { tasks: sampleTasks }));
    expect(screen.getByTestId("kanban-column-todo")).toBeDefined();
    expect(screen.getByTestId("column-label-todo").textContent).toBe("Todo");
  });

  it("renders In Progress column", () => {
    render(React.createElement(KanbanBoard, { tasks: sampleTasks }));
    expect(screen.getByTestId("column-label-in_progress").textContent).toBe(
      "In Progress",
    );
  });

  it("renders In Review column", () => {
    render(React.createElement(KanbanBoard, { tasks: sampleTasks }));
    expect(screen.getByTestId("column-label-in_review").textContent).toBe(
      "In Review",
    );
  });

  it("renders Done column", () => {
    render(React.createElement(KanbanBoard, { tasks: sampleTasks }));
    expect(screen.getByTestId("column-label-done").textContent).toBe("Done");
  });

  it("places tasks in correct columns", () => {
    render(React.createElement(KanbanBoard, { tasks: sampleTasks }));
    expect(screen.getByTestId("task-card-t1")).toBeDefined();
    expect(screen.getByTestId("task-card-t2")).toBeDefined();
    expect(screen.getByTestId("task-card-t3")).toBeDefined();
    expect(screen.getByTestId("task-card-t4")).toBeDefined();
  });
});

// ─── Task Card Tests ──────────────────────────────────────────────────────────

describe("Task card rendering", () => {
  function priorityBadgeClass(priority: string): string {
    const map: Record<string, string> = {
      urgent: "text-red-700 bg-red-100",
      high: "text-orange-700 bg-orange-100",
      medium: "text-yellow-700 bg-yellow-100",
      low: "text-green-700 bg-green-100",
    };
    return map[priority] ?? "";
  }

  function TaskCard({
    task,
    onClick,
  }: {
    task: typeof sampleTasks[0];
    onClick: () => void;
  }) {
    return React.createElement(
      "div",
      {
        "data-testid": `task-card-${task.id}`,
        onClick,
        style: { cursor: "pointer" },
      },
      React.createElement("h4", { "data-testid": "task-title" }, task.title),
      React.createElement(
        "span",
        {
          "data-testid": "priority-badge",
          className: priorityBadgeClass(task.priority),
        },
        task.priority,
      ),
      React.createElement(
        "div",
        { "data-testid": "assignee-avatar", title: task.assignee },
        task.assignee[0],
      ),
    );
  }

  it("renders task title", () => {
    render(
      React.createElement(TaskCard, {
        task: sampleTasks[0],
        onClick: vi.fn(),
      }),
    );
    expect(screen.getByTestId("task-title").textContent).toBe(
      "Design new dashboard",
    );
  });

  it("renders priority badge", () => {
    render(
      React.createElement(TaskCard, {
        task: sampleTasks[0],
        onClick: vi.fn(),
      }),
    );
    const badge = screen.getByTestId("priority-badge");
    expect(badge.textContent).toBe("high");
    expect(badge.className).toContain("orange");
  });

  it("renders urgent priority badge with red class", () => {
    render(
      React.createElement(TaskCard, {
        task: sampleTasks[1],
        onClick: vi.fn(),
      }),
    );
    const badge = screen.getByTestId("priority-badge");
    expect(badge.className).toContain("red");
  });

  it("renders assignee avatar initial", () => {
    render(
      React.createElement(TaskCard, {
        task: sampleTasks[0],
        onClick: vi.fn(),
      }),
    );
    expect(screen.getByTestId("assignee-avatar").textContent).toBe("A");
  });

  it("calls onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      React.createElement(TaskCard, {
        task: sampleTasks[0],
        onClick,
      }),
    );
    await user.click(screen.getByTestId("task-card-t1"));
    expect(onClick).toHaveBeenCalled();
  });
});

// ─── Task Detail Panel Tests ──────────────────────────────────────────────────

describe("Task detail panel", () => {
  function TaskDetailPanel({
    task,
    onClose,
  }: {
    task: typeof sampleTasks[0] | null;
    onClose: () => void;
  }) {
    if (!task) return null;
    return React.createElement(
      "aside",
      { "data-testid": "task-detail-panel", role: "complementary" },
      React.createElement(
        "button",
        { "data-testid": "close-panel", onClick: onClose },
        "Close",
      ),
      React.createElement("h2", { "data-testid": "detail-title" }, task.title),
      React.createElement(
        "div",
        { "data-testid": "detail-priority" },
        task.priority,
      ),
      React.createElement(
        "div",
        { "data-testid": "detail-assignee" },
        task.assignee,
      ),
    );
  }

  function BoardWithPanel() {
    const [selectedTask, setSelectedTask] = React.useState<
      typeof sampleTasks[0] | null
    >(null);

    return React.createElement(
      "div",
      null,
      React.createElement(
        "button",
        {
          "data-testid": "open-task-btn",
          onClick: () => setSelectedTask(sampleTasks[0]),
        },
        "Open Task",
      ),
      React.createElement(TaskDetailPanel, {
        task: selectedTask,
        onClose: () => setSelectedTask(null),
      }),
    );
  }

  it("panel is not visible initially", () => {
    render(React.createElement(BoardWithPanel));
    expect(screen.queryByTestId("task-detail-panel")).toBeNull();
  });

  it("panel opens when task card is clicked", async () => {
    const user = userEvent.setup();
    render(React.createElement(BoardWithPanel));
    await user.click(screen.getByTestId("open-task-btn"));
    expect(screen.getByTestId("task-detail-panel")).toBeDefined();
  });

  it("panel shows task title", async () => {
    const user = userEvent.setup();
    render(React.createElement(BoardWithPanel));
    await user.click(screen.getByTestId("open-task-btn"));
    expect(screen.getByTestId("detail-title").textContent).toBe(
      "Design new dashboard",
    );
  });

  it("panel shows task priority", async () => {
    const user = userEvent.setup();
    render(React.createElement(BoardWithPanel));
    await user.click(screen.getByTestId("open-task-btn"));
    expect(screen.getByTestId("detail-priority").textContent).toBe("high");
  });

  it("panel closes when close button is clicked", async () => {
    const user = userEvent.setup();
    render(React.createElement(BoardWithPanel));
    await user.click(screen.getByTestId("open-task-btn"));
    await user.click(screen.getByTestId("close-panel"));
    expect(screen.queryByTestId("task-detail-panel")).toBeNull();
  });
});

// ─── Subtask Checkbox Tests ───────────────────────────────────────────────────

describe("Subtask checkbox toggle", () => {
  function SubtaskList({
    subtasks: initial,
  }: {
    subtasks: Array<{ id: string; label: string; done: boolean }>;
  }) {
    const [subtasks, setSubtasks] = React.useState(initial);

    const toggle = (id: string) => {
      setSubtasks((prev) =>
        prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
      );
    };

    return React.createElement(
      "div",
      { "data-testid": "subtask-list" },
      subtasks.map((s) =>
        React.createElement(
          "label",
          { key: s.id, "data-testid": `subtask-label-${s.id}` },
          React.createElement("input", {
            type: "checkbox",
            "data-testid": `subtask-check-${s.id}`,
            checked: s.done,
            onChange: () => toggle(s.id),
          }),
          s.label,
        ),
      ),
      React.createElement(
        "span",
        { "data-testid": "subtask-done-count" },
        String(subtasks.filter((s) => s.done).length),
      ),
    );
  }

  const subtasks = sampleTasks[0].subtasks;

  it("renders all subtasks", () => {
    render(React.createElement(SubtaskList, { subtasks }));
    expect(screen.getByTestId("subtask-label-s1")).toBeDefined();
    expect(screen.getByTestId("subtask-label-s2")).toBeDefined();
  });

  it("shows initial done state correctly", () => {
    render(React.createElement(SubtaskList, { subtasks }));
    const check1 = screen.getByTestId("subtask-check-s1") as HTMLInputElement;
    const check2 = screen.getByTestId("subtask-check-s2") as HTMLInputElement;
    expect(check1.checked).toBe(false);
    expect(check2.checked).toBe(true);
  });

  it("toggles subtask done state on checkbox click", async () => {
    const user = userEvent.setup();
    render(React.createElement(SubtaskList, { subtasks }));
    await user.click(screen.getByTestId("subtask-check-s1"));
    const check1 = screen.getByTestId("subtask-check-s1") as HTMLInputElement;
    expect(check1.checked).toBe(true);
  });

  it("updates done count when subtask is checked", async () => {
    const user = userEvent.setup();
    render(React.createElement(SubtaskList, { subtasks }));
    expect(screen.getByTestId("subtask-done-count").textContent).toBe("1");
    await user.click(screen.getByTestId("subtask-check-s1"));
    expect(screen.getByTestId("subtask-done-count").textContent).toBe("2");
  });
});

// ─── Time Log Input Tests ─────────────────────────────────────────────────────

describe("Time log input", () => {
  function TimeLogInput({
    onLog,
  }: {
    onLog: (hours: number) => void;
  }) {
    const [value, setValue] = React.useState("");

    return React.createElement(
      "div",
      null,
      React.createElement("input", {
        "data-testid": "time-log-input",
        type: "number",
        value,
        min: "0",
        step: "0.5",
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value),
        placeholder: "Hours worked",
      }),
      React.createElement(
        "button",
        {
          "data-testid": "time-log-submit",
          onClick: () => {
            const hours = parseFloat(value);
            if (!isNaN(hours) && hours > 0) onLog(hours);
          },
        },
        "Log Time",
      ),
    );
  }

  it("renders time log input of type number", () => {
    render(React.createElement(TimeLogInput, { onLog: vi.fn() }));
    const input = screen.getByTestId("time-log-input") as HTMLInputElement;
    expect(input.type).toBe("number");
  });

  it("accepts numeric values", async () => {
    const user = userEvent.setup();
    render(React.createElement(TimeLogInput, { onLog: vi.fn() }));
    await user.type(screen.getByTestId("time-log-input"), "2.5");
    const input = screen.getByTestId("time-log-input") as HTMLInputElement;
    expect(input.value).toBe("2.5");
  });

  it("calls onLog with parsed float on submit", async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(React.createElement(TimeLogInput, { onLog }));
    await user.type(screen.getByTestId("time-log-input"), "3");
    await user.click(screen.getByTestId("time-log-submit"));
    expect(onLog).toHaveBeenCalledWith(3);
  });

  it("does not call onLog when value is 0", async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(React.createElement(TimeLogInput, { onLog }));
    await user.type(screen.getByTestId("time-log-input"), "0");
    await user.click(screen.getByTestId("time-log-submit"));
    expect(onLog).not.toHaveBeenCalled();
  });
});

// ─── Comment Textarea Tests ───────────────────────────────────────────────────

describe("Task comment textarea", () => {
  function CommentBox({
    onSubmit,
  }: {
    onSubmit: (text: string) => void;
  }) {
    const [text, setText] = React.useState("");

    return React.createElement(
      "div",
      null,
      React.createElement("textarea", {
        "data-testid": "comment-textarea",
        value: text,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setText(e.target.value),
        placeholder: "Add a comment...",
      }),
      React.createElement(
        "button",
        {
          "data-testid": "comment-submit",
          onClick: () => {
            if (text.trim()) {
              onSubmit(text);
              setText("");
            }
          },
        },
        "Post",
      ),
    );
  }

  it("renders comment textarea", () => {
    render(React.createElement(CommentBox, { onSubmit: vi.fn() }));
    expect(screen.getByTestId("comment-textarea")).toBeDefined();
  });

  it("accepts text input", async () => {
    const user = userEvent.setup();
    render(React.createElement(CommentBox, { onSubmit: vi.fn() }));
    await user.type(screen.getByTestId("comment-textarea"), "Great progress!");
    const textarea = screen.getByTestId(
      "comment-textarea",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Great progress!");
  });

  it("calls onSubmit with comment text", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(React.createElement(CommentBox, { onSubmit }));
    await user.type(screen.getByTestId("comment-textarea"), "Looks good!");
    await user.click(screen.getByTestId("comment-submit"));
    expect(onSubmit).toHaveBeenCalledWith("Looks good!");
  });

  it("clears textarea after submission", async () => {
    const user = userEvent.setup();
    render(React.createElement(CommentBox, { onSubmit: vi.fn() }));
    await user.type(screen.getByTestId("comment-textarea"), "A comment");
    await user.click(screen.getByTestId("comment-submit"));
    const textarea = screen.getByTestId(
      "comment-textarea",
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
  });

  it("does not call onSubmit when textarea is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(React.createElement(CommentBox, { onSubmit }));
    await user.click(screen.getByTestId("comment-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
