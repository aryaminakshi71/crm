/**
 * Integration Tests: Auth Flow
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Simulated auth flow logic (mirrors what routes do) ─────────────────────

interface AuthPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthResult {
  success: boolean;
  token?: string;
  user?: { id: string; email: string; name: string };
  error?: string;
}

async function loginUser(
  payload: AuthPayload,
  signIn: (p: AuthPayload) => Promise<any>,
): Promise<AuthResult> {
  if (!payload.email || !payload.password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const result = await signIn(payload);
    if (result.error) {
      return { success: false, error: result.error.message || "Invalid credentials" };
    }
    return {
      success: true,
      user: result.data?.user,
      token: result.data?.token,
    };
  } catch (err) {
    return { success: false, error: "Authentication failed" };
  }
}

async function registerUser(
  payload: RegisterPayload,
  signUp: (p: any) => Promise<any>,
): Promise<AuthResult> {
  if (payload.password !== payload.confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }
  if (payload.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }
  if (!payload.email.includes("@")) {
    return { success: false, error: "Invalid email address" };
  }

  try {
    const result = await signUp({
      email: payload.email,
      password: payload.password,
      name: payload.name,
    });
    if (result.error) {
      return { success: false, error: result.error.message || "Registration failed" };
    }
    return { success: true, user: result.data?.user };
  } catch {
    return { success: false, error: "Registration failed" };
  }
}

async function sendPasswordResetEmail(
  email: string,
  sendReset: (email: string) => Promise<any>,
): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email address is required" };
  }
  try {
    await sendReset(email);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send reset email" };
  }
}

// ─── Login form submission Tests ─────────────────────────────────────────────

describe("Login form submission", () => {
  let mockSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignIn = vi.fn().mockResolvedValue({
      data: {
        user: { id: "user_1", email: "test@example.com", name: "Test User" },
        token: "jwt-token-abc",
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends email and password to signIn function", async () => {
    await loginUser({ email: "alice@example.com", password: "pass1234" }, mockSignIn);
    expect(mockSignIn).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "pass1234",
    });
  });

  it("returns success with user data on valid credentials", async () => {
    const result = await loginUser(
      { email: "test@example.com", password: "password123" },
      mockSignIn,
    );
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });

  it("returns error when email is missing", async () => {
    const result = await loginUser(
      { email: "", password: "password123" },
      mockSignIn,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("required");
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("returns error when password is missing", async () => {
    const result = await loginUser(
      { email: "test@example.com", password: "" },
      mockSignIn,
    );
    expect(result.success).toBe(false);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows error message on invalid credentials", async () => {
    mockSignIn.mockResolvedValue({
      data: null,
      error: { message: "Invalid email or password" },
    });

    const result = await loginUser(
      { email: "test@example.com", password: "wrongpass" },
      mockSignIn,
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("handles network error gracefully", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"));
    const result = await loginUser(
      { email: "test@example.com", password: "pass123" },
      mockSignIn,
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication failed");
  });

  it("successful login returns a token", async () => {
    const result = await loginUser(
      { email: "test@example.com", password: "pass1234" },
      mockSignIn,
    );
    expect(result.token).toBe("jwt-token-abc");
  });
});

// ─── Register form validation Tests ──────────────────────────────────────────

describe("Register form validation", () => {
  let mockSignUp: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignUp = vi.fn().mockResolvedValue({
      data: {
        user: { id: "user_2", email: "new@example.com", name: "New User" },
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when passwords do not match", async () => {
    const result = await registerUser(
      {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different123",
      },
      mockSignUp,
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Passwords do not match");
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("returns error when password is too short (< 8 chars)", async () => {
    const result = await registerUser(
      {
        name: "Test User",
        email: "test@example.com",
        password: "pass",
        confirmPassword: "pass",
      },
      mockSignUp,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("8 characters");
  });

  it("returns error for invalid email format", async () => {
    const result = await registerUser(
      {
        name: "Test User",
        email: "not-an-email",
        password: "password123",
        confirmPassword: "password123",
      },
      mockSignUp,
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("email");
  });

  it("calls signUp with correct payload when valid", async () => {
    await registerUser(
      {
        name: "Alice Smith",
        email: "alice@example.com",
        password: "securepass",
        confirmPassword: "securepass",
      },
      mockSignUp,
    );

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "securepass",
      name: "Alice Smith",
    });
  });

  it("returns success when registration is valid", async () => {
    const result = await registerUser(
      {
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      mockSignUp,
    );
    expect(result.success).toBe(true);
  });

  it("handles server-side registration error", async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: "Email already exists" },
    });

    const result = await registerUser(
      {
        name: "Bob",
        email: "existing@example.com",
        password: "password123",
        confirmPassword: "password123",
      },
      mockSignUp,
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email already exists");
  });
});

// ─── Forgot password form Tests ───────────────────────────────────────────────

describe("Forgot password form", () => {
  let mockSendReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSendReset = vi.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends reset email for valid email address", async () => {
    const result = await sendPasswordResetEmail(
      "user@example.com",
      mockSendReset,
    );
    expect(result.success).toBe(true);
    expect(mockSendReset).toHaveBeenCalledWith("user@example.com");
  });

  it("returns error for empty email", async () => {
    const result = await sendPasswordResetEmail("", mockSendReset);
    expect(result.success).toBe(false);
    expect(mockSendReset).not.toHaveBeenCalled();
  });

  it("returns error for invalid email format", async () => {
    const result = await sendPasswordResetEmail("notanemail", mockSendReset);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("handles sendReset function throwing an error", async () => {
    mockSendReset.mockRejectedValue(new Error("Service unavailable"));
    const result = await sendPasswordResetEmail(
      "user@example.com",
      mockSendReset,
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ─── Redirect after login Tests ───────────────────────────────────────────────

describe("Redirect behavior after login", () => {
  it("determines redirect target from URL param", () => {
    function getRedirectTarget(searchString: string): string {
      const params = new URLSearchParams(searchString);
      return params.get("redirect") || "/app";
    }

    expect(getRedirectTarget("?redirect=/app/crm")).toBe("/app/crm");
    expect(getRedirectTarget("")).toBe("/app");
    expect(getRedirectTarget("?other=param")).toBe("/app");
  });

  it("defaults to /app when no redirect param is present", () => {
    function getRedirectTarget(searchString: string): string {
      const params = new URLSearchParams(searchString);
      return params.get("redirect") || "/app";
    }
    expect(getRedirectTarget("")).toBe("/app");
  });
});
