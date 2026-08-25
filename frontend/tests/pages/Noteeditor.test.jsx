import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import NoteEditor from "../../src/pages/note-editor/NoteEditor";
import api from "../../src/api/api";

// Mock react-router-dom's useNavigate + useParams (mutable per test)
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock the api module
jest.mock("../../src/api/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

// The toolbar has its own dedicated test file — stub it here.
jest.mock("../../src/components/note-editor-toolbar/NoteEditorToolbar", () => () => (
  <div data-testid="toolbar" />
));

// ProseMirror (which Tiptap wraps) doesn't run reliably inside jsdom, so we
// stub the editor instance and only the members NoteEditor actually calls:
// commands.setContent, commands.focus, and getHTML.
const mockSetContent = jest.fn();
const mockFocus = jest.fn();
const mockGetHTML = jest.fn(() => "<p>note body</p>");

jest.mock("@tiptap/react", () => ({
  useEditor: () => ({
    commands: {
      setContent: (...args) => mockSetContent(...args),
      focus: (...args) => mockFocus(...args),
    },
    getHTML: (...args) => mockGetHTML(...args),
    isActive: () => false,
  }),
  EditorContent: () => <div data-testid="editor-content" />,
}));

jest.mock("@tiptap/starter-kit", () => ({ __esModule: true, default: {} }));
jest.mock("@tiptap/extension-placeholder", () => ({
  __esModule: true,
  default: { configure: () => ({}) },
}));

describe("NoteEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({}); // create mode by default
  });

  describe("create mode", () => {
    it("renders the empty form without fetching a note", () => {
      render(<NoteEditor />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/title of your brilliant note/i)).toHaveValue("");
      expect(screen.getByRole("button", { name: /save note/i })).toBeInTheDocument();
      expect(api.get).not.toHaveBeenCalled();
    });

    it("updates the title field as the user types", async () => {
      const user = userEvent.setup();
      render(<NoteEditor />);

      const titleInput = screen.getByPlaceholderText(/title of your brilliant note/i);
      await user.type(titleInput, "My new note");

      expect(titleInput).toHaveValue("My new note");
    });

    it("navigates back to the dashboard when Back is clicked", async () => {
      const user = userEvent.setup();
      render(<NoteEditor />);

      await user.click(screen.getByRole("button", { name: /back to dashboard/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("shows a validation error and does not call the API when title is empty", async () => {
      const user = userEvent.setup();
      render(<NoteEditor />);

      await user.click(screen.getByRole("button", { name: /save note/i }));

      expect(
        await screen.findByText(/please add a title before saving/i),
      ).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it("shows a validation error when the title is only whitespace", async () => {
      const user = userEvent.setup();
      render(<NoteEditor />);

      await user.type(screen.getByPlaceholderText(/title of your brilliant note/i), "   ");
      await user.click(screen.getByRole("button", { name: /save note/i }));

      expect(
        await screen.findByText(/please add a title before saving/i),
      ).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it("dismisses the error banner when the dismiss button is clicked", async () => {
      const user = userEvent.setup();
      render(<NoteEditor />);

      await user.click(screen.getByRole("button", { name: /save note/i }));
      expect(await screen.findByText(/please add a title before saving/i)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /dismiss error/i }));

      expect(screen.queryByText(/please add a title before saving/i)).not.toBeInTheDocument();
    });

    it("creates a note with the trimmed title and editor content, then navigates to the dashboard", async () => {
      const user = userEvent.setup();
      api.post.mockResolvedValueOnce({ data: {} });

      render(<NoteEditor />);

      await user.type(
        screen.getByPlaceholderText(/title of your brilliant note/i),
        "  My new note  ",
      );
      await user.click(screen.getByRole("button", { name: /save note/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/notes", {
          title: "My new note",
          content: "<p>note body</p>",
        });
      });
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("shows the server error message when creating a note fails", async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce({
        response: { data: { message: "Title already exists" } },
      });

      render(<NoteEditor />);

      await user.type(screen.getByPlaceholderText(/title of your brilliant note/i), "Note");
      await user.click(screen.getByRole("button", { name: /save note/i }));

      expect(await screen.findByText(/title already exists/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("shows a fallback error message when creating a note fails with no response body", async () => {
      const user = userEvent.setup();
      api.post.mockRejectedValueOnce(new Error("Network Error"));

      render(<NoteEditor />);

      await user.type(screen.getByPlaceholderText(/title of your brilliant note/i), "Note");
      await user.click(screen.getByRole("button", { name: /save note/i }));

      expect(
        await screen.findByText(/couldn't save your note. please try again/i),
      ).toBeInTheDocument();
    });

    it("disables the save button and shows 'Saving...' while the request is pending", async () => {
      const user = userEvent.setup();
      let resolvePromise;
      api.post.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      render(<NoteEditor />);

      await user.type(screen.getByPlaceholderText(/title of your brilliant note/i), "Note");
      await user.click(screen.getByRole("button", { name: /save note/i }));

      const savingButton = screen.getByRole("button", { name: /saving/i });
      expect(savingButton).toBeDisabled();

      resolvePromise({ data: {} });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });
  });

  describe("edit mode", () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ id: "note-1" });
    });

    it("shows a loading state while the existing note is being fetched", async () => {
      let resolvePromise;
      api.get.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      render(<NoteEditor />);

      expect(screen.getByRole("status")).toBeInTheDocument();

      resolvePromise({ data: { note: { title: "Existing note", content: "<p>old</p>" } } });

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });

    it("populates the title and editor content from a { note: {...} } response", async () => {
      api.get.mockResolvedValueOnce({
        data: { note: { title: "Existing note", content: "<p>old</p>" } },
      });

      render(<NoteEditor />);

      expect(
        await screen.findByDisplayValue("Existing note"),
      ).toBeInTheDocument();
      expect(mockSetContent).toHaveBeenCalledWith("<p>old</p>");
      expect(api.get).toHaveBeenCalledWith("/notes/note-1");
    });

    it("populates the title and editor content from a flat response (no wrapper)", async () => {
      api.get.mockResolvedValueOnce({
        data: { title: "Flat note", content: "<p>flat</p>" },
      });

      render(<NoteEditor />);

      expect(await screen.findByDisplayValue("Flat note")).toBeInTheDocument();
      expect(mockSetContent).toHaveBeenCalledWith("<p>flat</p>");
    });

    it("shows a 'Note not found' message on a 404 response", async () => {
      api.get.mockRejectedValueOnce({ response: { status: 404 } });

      render(<NoteEditor />);

      expect(await screen.findByText(/note not found/i)).toBeInTheDocument();
    });

    it("shows a generic error message on a non-404 fetch failure", async () => {
      api.get.mockRejectedValueOnce(new Error("Network Error"));

      render(<NoteEditor />);

      expect(
        await screen.findByText(/couldn't load this note. please try again/i),
      ).toBeInTheDocument();
    });

    it("updates the existing note via PUT and navigates to the dashboard", async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValueOnce({
        data: { note: { title: "Existing note", content: "<p>old</p>" } },
      });
      api.put.mockResolvedValueOnce({ data: {} });

      render(<NoteEditor />);

      await screen.findByDisplayValue("Existing note");
      await user.click(screen.getByRole("button", { name: /save note/i }));

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith("/notes/note-1", {
          title: "Existing note",
          content: "<p>note body</p>",
        });
      });
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});