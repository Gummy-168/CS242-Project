export type Assignment = {
  id: number;
  title: string;
  description: string;
  deadline: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  tag_color: string;
  user_id: number;
  course_id: number | null;
  course_name?: string | null;
  score: number | null;
  difficulty: number | null;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: number;
  email?: string;
  username: string;
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export type LoginResponse = {
  message: string;
  user: AuthUser;
};

export type AssignmentCreatePayload = {
  title: string;
  description: string;
  deadline: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  tag_color?: string;
  user_id: number;
  course_id?: number | null;
  course_name?: string | null;
  score?: number | null;
  difficulty?: number | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function parseApiError(response: Response) {
  try {
    const errorData = await response.json();
    if (typeof errorData?.detail === "string") {
      return errorData.detail;
    }
  } catch {
    return `Request failed: ${response.status}`;
  }

  return `Request failed: ${response.status}`;
}

export const authAPI = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },
};

export const assignmentAPI = {
  async getAll(): Promise<Assignment[]> {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch assignments: ${response.status}`);
    }

    return response.json();
  },

  async create(payload: AssignmentCreatePayload): Promise<Assignment> {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create assignment: ${response.status} ${errorText}`,
      );
    }

    return response.json();
  },
};
