import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import SignUp from "../../src/pages/sign-up/SignUp";
import api from "../../src/api/api";
import { useAuth } from "../../src/context/AuthContext";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock("../../src/components/auth-layout/AuthLayout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("../../src/api/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("SignUp", () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  it("renders name, email, password fields and submit button", () => {
    render(<SignUp />);
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows required error for whitespace-only name", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "   ");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows required error for whitespace-only email", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "   ");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows required error for whitespace-only password", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "        "); // 8 spaces, trims to empty
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows an error for an invalid email format", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("treats email with leading/trailing spaces as valid (browser auto-trims type=email inputs)", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), " test@example.com ");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/signup", {
        name: "Urooj",
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows an error when password is shorter than 8 characters", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("accepts a password exactly 8 characters long", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "eightchr");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/signup", {
        name: "Urooj",
        email: "test@example.com",
        password: "eightchr",
      });
    });
  });

  it("submits valid details, calls the signup endpoint, and navigates to login", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ data: {} });

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/signup", {
        name: "Urooj",
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("displays a server error message when signup fails (e.g. duplicate email)", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: { data: { message: "Email already in use" } },
    });

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows a fallback error message on network failure (no response object)", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce(new Error("Network Error"));

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

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

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    const submitButton = screen.getByRole("button", { name: /creating account/i });
    expect(submitButton).toBeDisabled();

    resolvePromise({ data: {} });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
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

    render(<SignUp />);

    await user.type(screen.getByLabelText(/^name$/i), "Urooj");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");

    const submitButton = screen.getByRole("button", { name: /create account/i });
    await user.click(submitButton);
    await user.click(submitButton); 

    resolvePromise({ data: {} });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });

  it("toggles password visibility when the eye icon is clicked", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

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
    render(<SignUp />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButton = screen.getByRole("button", {
      name: /toggle password visibility/i,
    });

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("clears the field error as soon as the user starts typing in that field", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^name$/i), "U");

    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });
});