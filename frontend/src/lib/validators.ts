export const validators = {
  fullName: (v: string) =>
    v.trim().length < 2
      ? "Enter your full name"
      : v.trim().length > 255
        ? "Name is too long"
        : null,
  email: (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? null
      : "Enter a valid email address",
  password: (v: string) =>
    v.length < 8
      ? "Use at least 8 characters"
      : v.length > 128
        ? "Use 128 characters or fewer"
        : null,
  confirmPassword: (v: string, password: string) =>
    v !== password ? "Passwords do not match" : null,
  geminiKey: (v: string) =>
    v.trim().length < 20 ? "Paste your full Gemini API key" : null,
};
