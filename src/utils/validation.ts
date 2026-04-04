export function isValidEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function isValidPassword(password: string): boolean {
  return password.trim().length >= 6;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

