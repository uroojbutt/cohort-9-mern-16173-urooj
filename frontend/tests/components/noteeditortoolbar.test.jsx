import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import NoteEditorToolbar from "../../src/components/note-editor-toolbar/NoteEditorToolbar";

// Builds a chainable mock that mimics editor.chain().focus().toggleX().run().
// Every method returns the same chain object so calls can be composed just
// like the real Tiptap chain, and every call is a jest.fn() we can assert on.
function createChainMock() {
  const chain = {};
  const methods = [
    "focus",
    "toggleBold",
    "toggleItalic",
    "toggleStrike",
    "toggleHeading",
    "toggleBulletList",
    "toggleOrderedList",
    "undo",
    "redo",
    "run",
  ];
  methods.forEach((method) => {
    chain[method] = jest.fn((...args) => chain);
  });
  return chain;
}

// activeStates keys: "bold", "italic", "strike", "heading:2", "bulletList", "orderedList"
function createMockEditor({ activeStates = {}, canUndo = true, canRedo = true } = {}) {
  const chain = createChainMock();
  const editor = {
    chain: jest.fn(() => chain),
    isActive: jest.fn((name, attrs) => {
      const key = attrs?.level ? `${name}:${attrs.level}` : name;
      return Boolean(activeStates[key]);
    }),
    can: jest.fn(() => ({ undo: () => canUndo, redo: () => canRedo })),
  };
  return { editor, chain };
}

describe("NoteEditorToolbar", () => {
  it("renders nothing when no editor is provided", () => {
    const { container } = render(<NoteEditorToolbar editor={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders all formatting and history buttons", () => {
    const { editor } = createMockEditor();
    render(<NoteEditorToolbar editor={editor} />);

    [
      "Bold",
      "Italic",
      "Strikethrough",
      "Heading",
      "Bullet list",
      "Numbered list",
      "Undo",
      "Redo",
    ].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it.each([
    ["Bold", "toggleBold"],
    ["Italic", "toggleItalic"],
    ["Strikethrough", "toggleStrike"],
    ["Bullet list", "toggleBulletList"],
    ["Numbered list", "toggleOrderedList"],
    ["Undo", "undo"],
    ["Redo", "redo"],
  ])("clicking %s calls editor.chain().focus().%s().run()", async (label, chainMethod) => {
    const user = userEvent.setup();
    const { editor, chain } = createMockEditor();
    render(<NoteEditorToolbar editor={editor} />);

    await user.click(screen.getByRole("button", { name: label }));

    expect(editor.chain).toHaveBeenCalled();
    expect(chain.focus).toHaveBeenCalled();
    expect(chain[chainMethod]).toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalled();
  });

  it("clicking Heading calls toggleHeading with level 2", async () => {
    const user = userEvent.setup();
    const { editor, chain } = createMockEditor();
    render(<NoteEditorToolbar editor={editor} />);

    await user.click(screen.getByRole("button", { name: "Heading" }));

    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 2 });
    expect(chain.run).toHaveBeenCalled();
  });

  it("marks a button as pressed when its mark is active", () => {
    const { editor } = createMockEditor({ activeStates: { bold: true } });
    render(<NoteEditorToolbar editor={editor} />);

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("checks heading active state using the level-2 attribute", () => {
    const { editor } = createMockEditor({ activeStates: { "heading:2": true } });
    render(<NoteEditorToolbar editor={editor} />);

    expect(screen.getByRole("button", { name: "Heading" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(editor.isActive).toHaveBeenCalledWith("heading", { level: 2 });
  });

  it("disables Undo when editor.can().undo() is false", () => {
    const { editor } = createMockEditor({ canUndo: false });
    render(<NoteEditorToolbar editor={editor} />);

    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  it("disables Redo when editor.can().redo() is false", () => {
    const { editor } = createMockEditor({ canRedo: false });
    render(<NoteEditorToolbar editor={editor} />);

    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });

  it("enables Undo and Redo when both are available", () => {
    const { editor } = createMockEditor({ canUndo: true, canRedo: true });
    render(<NoteEditorToolbar editor={editor} />);

    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeEnabled();
  });

  it("prevents default on mouse down so the editor selection isn't lost on click", () => {
    const { editor } = createMockEditor();
    render(<NoteEditorToolbar editor={editor} />);

    const boldButton = screen.getByRole("button", { name: "Bold" });
    const wasNotCancelled = fireEvent.mouseDown(boldButton);

    // fireEvent's return value mirrors dispatchEvent(): false means
    // preventDefault() was called on the event.
    expect(wasNotCancelled).toBe(false);
  });
});