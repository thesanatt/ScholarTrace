const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AuthResponse {
  token: string;
  professor: {
    id: string;
    name: string;
    email: string;
  };
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("scholartrace_token");
}

export function setToken(token: string): void {
  localStorage.setItem("scholartrace_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("scholartrace_token");
}

export function getProfessor(): AuthResponse["professor"] | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("scholartrace_professor");
  return data ? JSON.parse(data) : null;
}

export function setProfessor(professor: AuthResponse["professor"]): void {
  localStorage.setItem("scholartrace_professor", JSON.stringify(professor));
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Login failed");
  }
  const data: AuthResponse = await res.json();
  setToken(data.token);
  setProfessor(data.professor);
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Registration failed");
  }
  const data: AuthResponse = await res.json();
  setToken(data.token);
  setProfessor(data.professor);
  return data;
}

export function logout(): void {
  removeToken();
  localStorage.removeItem("scholartrace_professor");
}

async function authFetch(endpoint: string): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error("Session expired");
  }
  return res;
}

export async function getStudents(): Promise<string[]> {
  const res = await authFetch("/api/logs/students");
  if (!res.ok) throw new Error("Failed to fetch students");
  const data = await res.json();
  return data.students;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStudentLogs(email: string): Promise<any[]> {
  const res = await authFetch(`/api/logs/${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  const data = await res.json();
  return data.logs;
}