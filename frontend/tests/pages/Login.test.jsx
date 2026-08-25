import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import Login from "../../src/pages/login/Login";
import api from "../../src/api/api";
import { useAuth } from "../../src/context/AuthContext";

// Mock react-router-dom's useNavigate + Link
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock the AuthLayout wrapper to just render children
jest.mock("../../src/components/auth-layout/AuthLayout", () => ({ children }) => (
  <div>{children}</div>
));

// Mock the api module
jest.mock("../../src/api/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock AuthContext's useAuth hook
jest.mock("../../src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("Login", () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  it("renders email and password fields and submit button", () => {
    render(<Login />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid email format", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.type(screen.getByLabelText(/^password$/i), "somepassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it("submits valid credentials, calls login, and navigates to dashboard", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({
      data: { access_token: "fake-token", user: { id: "1", email: "test@example.com" } },
    });

    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(mockLogin).toHaveBeenCalledWith(
      { id: "1", email: "test@example.com" },
      "fake-token",
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("displays a server error message when login fails", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });

    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("toggles password visibility when the eye icon is clicked", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", {
      name: /toggle password visibility/i,
    });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("toggles password visibility back to hidden on second click", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButton = screen.getByRole("button", {
      name: /toggle password visibility/i,
    });

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows required error for whitespace-only email", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), "   ");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows required error for whitespace-only password", async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "   ");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("treats email with leading/trailing spaces as valid (browser auto-trims type=email inputs)", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({
      data: { access_token: "fake-token", user: { id: "1", email: "test@example.com" } },
    });

    render(<Login />);

    // type="email" inputs strip leading/trailing whitespace at the DOM level
    // before our validation code ever sees the value.
    await user.type(screen.getByLabelText(/email address/i), " test@example.com ");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows a fallback error message on network failure (no response object)", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce(new Error("Network Error"));

    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/something went wrong.*check your connection/i),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("disables the submit button and shows loading text while request is pending", async () => {
    const user = userEvent.setup();
    let resolvePromise;
    api.post.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    const submitButton = screen.getByRole("button", { name: /logging in/i });
    expect(submitButton).toBeDisabled();

    resolvePromise({
      data: { access_token: "fake-token", user: { id: "1", email: "test@example.com" } },
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("prevents a second submission while the first request is still pending", async () => {
    const user = userEvent.setup();
    let resolvePromise;
    api.post.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(<Login />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");

    const submitButton = screen.getByRole("button", { name: /log in/i });
    await user.click(submitButton);
    await user.click(submitButton); // second click while disabled

    resolvePromise({
      data: { access_token: "fake-token", user: { id: "1", email: "test@example.com" } },
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });
});