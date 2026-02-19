import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "./RegistrationForm";
import { trpc } from "@/lib/trpc";

// Mock the trpc mutation
vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      register: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe("RegistrationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the registration form", () => {
    const mockMutation = {
      mutate: vi.fn(),
      isPending: false,
    };
    vi.mocked(trpc.auth.register.useMutation).mockReturnValue(mockMutation as any);

    render(<RegistrationForm />);

    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("john@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("+233 XX XXX XXXX")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const mockMutation = {
      mutate: vi.fn(),
      isPending: false,
    };
    vi.mocked(trpc.auth.register.useMutation).mockReturnValue(mockMutation as any);

    render(<RegistrationForm />);

    const submitButton = screen.getByRole("button", { name: /Register Now/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    const mockMutation = {
      mutate: vi.fn(),
      isPending: false,
    };
    vi.mocked(trpc.auth.register.useMutation).mockReturnValue(mockMutation as any);

    render(<RegistrationForm />);

    const nameInput = screen.getByPlaceholderText("John Doe");
    const emailInput = screen.getByPlaceholderText("john@example.com");
    const submitButton = screen.getByRole("button", { name: /Register Now/i });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "invalid-email");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const mockMutation = {
      mutate: vi.fn(),
      isPending: false,
    };
    vi.mocked(trpc.auth.register.useMutation).mockReturnValue(mockMutation as any);

    render(<RegistrationForm />);

    const nameInput = screen.getByPlaceholderText("John Doe");
    const emailInput = screen.getByPlaceholderText("john@example.com");
    const phoneInput = screen.getByPlaceholderText("+233 XX XXX XXXX");
    const submitButton = screen.getByRole("button", { name: /Register Now/i });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    await userEvent.type(phoneInput, "0123456789");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutation.mutate).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        phone: "0123456789",
        role: "farmer",
      });
    });
  });

  it("displays success message on successful registration", async () => {
    const mockMutation = {
      mutate: vi.fn((data, options) => {
        options.onSuccess({ name: "John Doe", email: "john@example.com" });
      }),
      isPending: false,
    };
    vi.mocked(trpc.auth.register.useMutation).mockReturnValue(mockMutation as any);

    render(<RegistrationForm />);

    const nameInput = screen.getByPlaceholderText("John Doe");
    const emailInput = screen.getByPlaceholderText("john@example.com");
    const submitButton = screen.getByRole("button", { name: /Register Now/i });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Registration successful/i)).toBeInTheDocument();
    });
  });

  it("displays error message on registration failure", async () => {
    const mockMutation = {
      mutate: vi.fn((data, options) => {
        options.onError({ message: "Email already registered" });
      }),
      isPending: false,
    };
    vi.mocked(trpc.auth.register.useMutation).mockReturnValue(mockMutation as any);

    render(<RegistrationForm />);

    const nameInput = screen.getByPlaceholderText("John Doe");
    const emailInput = screen.getByPlaceholderText("john@example.com");
    const submitButton = screen.getByRole("button", { name: /Register Now/i });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeInTheDocument();
    });
  });
});
