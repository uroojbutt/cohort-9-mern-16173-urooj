import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import Dashboard from "../../src/pages/dashboard/Dashboard";
import api from "../../src/api/api";
import { useAuth } from "../../src/context/AuthContext";

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the api module
jest.mock("../../src/api/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock AuthContext's useAuth hook
jest.mock("../../src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock child components as simple stubs so this file tests Dashboard's
// own logic (fetching, filtering, delete, logout) without depending on
// their internal rendering details.
jest.mock("../../src/components/header/Header", () => (props) => (
  <div data-testid="header">
    <span>{props.user?.name}</span>
    <button onClick={props.handleLogout}>Logout</button>
  </div>
));

jest.mock("../../src/components/dashboard-actions/DashboardActions", () => (props) => (
  <input
    aria-label="search notes"
    value={props.searchQuery}
    onChange={(e) => props.setSearchQuery(e.target.value)}
  />
));

jest.mock("../../src/components/loading-spinner/LoadingSpinner", () => () => (
  <div role="status">Loading...</div>
));

jest.mock("../../src/components/empty-state/EmptyState", () => (props) => (
  <div data-testid="empty-state">
    No notes{props.searchQuery ? ` for "${props.searchQuery}"` : ""}
  </div>
));

jest.mock("../../src/components/notes-grid/NotesGrid", () => (props) => (
  <div data-testid="notes-grid">
    {props.filteredNotes.map((note) => (
      <div key={note._id}>
        <span>{note.title}</span>
        <button onClick={() => props.handleDelete(note._id)}>
          Delete {note.title}
        </button>
      </div>
    ))}
  </div>
));

jest.mock("../../src/components/buttons/ExportButton", () => (props) => (
  <button data-testid="export-button" disabled={props.disabled}>
    Export
  </button>
));

jest.mock("../../src/components/buttons/ImportButton", () => (props) => (
  <button data-testid="import-button" onClick={props.onImportSuccess}>
    Import
  </button>
));

const mockNotes = [
  { _id: "1", title: "Grocery list", content: "milk, eggs, bread" },
  { _id: "2", title: "Trip plan", content: "book flights and hotel" },
];

describe("Dashboard", () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { name: "Urooj" }, logout: mockLogout });
    jest.spyOn(window, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert.mockRestore();
    console.error.mockRestore();
  });

  it("shows a loading spinner while notes are being fetched", async () => {
    let resolvePromise;
    api.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(<Dashboard />);

    expect(screen.getByRole("status")).toBeInTheDocument();

    resolvePromise({ data: mockNotes });

    await waitFor(() => {
      expect(screen.getByText("Grocery list")).toBeInTheDocument();
    });
  });

  it("renders notes when the API returns a plain array", async () => {
    api.get.mockResolvedValueOnce({ data: mockNotes });

    render(<Dashboard />);

    expect(await screen.findByText("Grocery list")).toBeInTheDocument();
    expect(screen.getByText("Trip plan")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/notes");
  });

  it("renders notes when the API returns a { notes: [...] } wrapper", async () => {
    api.get.mockResolvedValueOnce({ data: { notes: mockNotes } });

    render(<Dashboard />);

    expect(await screen.findByText("Grocery list")).toBeInTheDocument();
    expect(screen.getByText("Trip plan")).toBeInTheDocument();
  });

  it("shows an error state with a retry button when the response format is invalid", async () => {
    api.get.mockResolvedValueOnce({ data: "unexpected string response" });

    render(<Dashboard />);

    expect(
      await screen.findByText(/couldn't load your notes/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("shows an error state when the fetch request rejects", async () => {
    api.get.mockRejectedValueOnce(new Error("Network Error"));

    render(<Dashboard />);

    expect(
      await screen.findByText(/couldn't load your notes/i),
    ).toBeInTheDocument();
  });

  it("refetches notes when the retry button is clicked", async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValueOnce(new Error("Network Error"));
    api.get.mockResolvedValueOnce({ data: mockNotes });

    render(<Dashboard />);

    const retryButton = await screen.findByRole("button", { name: /retry/i });
    await user.click(retryButton);

    expect(await screen.findByText("Grocery list")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("shows the empty state when there are no notes", async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    render(<Dashboard />);

    expect(await screen.findByTestId("empty-state")).toBeInTheDocument();
  });

  it("filters notes by title as the user types in the search box", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: mockNotes });

    render(<Dashboard />);
    await screen.findByText("Grocery list");

    await user.type(screen.getByLabelText(/search notes/i), "trip");

    expect(screen.queryByText("Grocery list")).not.toBeInTheDocument();
    expect(screen.getByText("Trip plan")).toBeInTheDocument();
  });

  it("filters notes by content as well as title", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: mockNotes });

    render(<Dashboard />);
    await screen.findByText("Grocery list");

    await user.type(screen.getByLabelText(/search notes/i), "flights");

    expect(screen.queryByText("Grocery list")).not.toBeInTheDocument();
    expect(screen.getByText("Trip plan")).toBeInTheDocument();
  });

  it("shows the empty state with the search query when nothing matches", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: mockNotes });

    render(<Dashboard />);
    await screen.findByText("Grocery list");

    await user.type(screen.getByLabelText(/search notes/i), "nonexistent");

    expect(await screen.findByTestId("empty-state")).toHaveTextContent(
      /nonexistent/i,
    );
  });

  it("calls logout and navigates to /login when logging out", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: mockNotes });

    render(<Dashboard />);
    await screen.findByText("Grocery list");

    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("removes a note from the list after a successful delete", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: mockNotes });
    api.delete.mockResolvedValueOnce({});

    render(<Dashboard />);
    await screen.findByText("Grocery list");

    await user.click(screen.getByRole("button", { name: /delete grocery list/i }));

    expect(api.delete).toHaveBeenCalledWith("/notes/1");
    await waitFor(() => {
      expect(screen.queryByText("Grocery list")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Trip plan")).toBeInTheDocument();
  });

  it("shows an alert and keeps the note in the list when delete fails", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: mockNotes });
    api.delete.mockRejectedValueOnce(new Error("Delete failed"));

    render(<Dashboard />);
    await screen.findByText("Grocery list");

    await user.click(screen.getByRole("button", { name: /delete grocery list/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to delete note");
    });
    expect(screen.getByText("Grocery list")).toBeInTheDocument();
  });

  it("disables the export button when there are no notes to export", async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    render(<Dashboard />);

    await screen.findByTestId("empty-state");
    expect(screen.getByTestId("export-button")).toBeDisabled();
  });

  it("enables the export button when notes are present", async () => {
    api.get.mockResolvedValueOnce({ data: mockNotes });

    render(<Dashboard />);

    await screen.findByText("Grocery list");
    expect(screen.getByTestId("export-button")).toBeEnabled();
  });

  it("refetches notes when an import completes successfully", async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: [] });
    api.get.mockResolvedValueOnce({ data: mockNotes });

    render(<Dashboard />);
    await screen.findByTestId("empty-state");

    await user.click(screen.getByTestId("import-button"));

    expect(await screen.findByText("Grocery list")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});