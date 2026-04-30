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

export type AssignmentUpdatePayload = AssignmentCreatePayload;

export type PrioritySummaryItem = {
  priority: string;
  count: number;
};

export type UpcomingDeadlineItem = {
  id: number;
  title: string;
  course_name: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | string;
  deadline: string;
  days_remaining: number;
};

export type TaskInsightsResponse = {
  user_id: number;
  generated_at: string;
  priority_counts: Record<string, number>;
  priority_summary: PrioritySummaryItem[];
  upcoming_total: number;
  upcoming_deadlines: UpcomingDeadlineItem[];
};

export type NotificationSettings = {
  user_id: number;
  email_enabled: boolean;
  reminder_days: number[];
  updated_at: string;
};

export type NotificationSettingsUpdatePayload = {
  email_enabled: boolean;
  reminder_days: number[];
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

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
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        `Cannot connect to backend API at ${API_BASE_URL}. Please ensure backend is running and CORS allows this frontend origin.`,
      );
    }

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        `Cannot connect to backend API at ${API_BASE_URL}. Please ensure backend is running and CORS allows this frontend origin.`,
      );
    }

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },
};

export const assignmentAPI = {
  async getAll(): Promise<Assignment[]> {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      throw new Error("User not logged in");
    }
    const response = await fetch(`${API_BASE_URL}/assignments?user_id=${userId}`, {
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
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },

  async getById(id: number): Promise<Assignment> {
    const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },

  async updateAssignment(
    id: number,
    payload: AssignmentUpdatePayload,
  ): Promise<Assignment> {
    const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
      method: "PUT",
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

  async deleteAssignment(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },
};

export const statisticsAPI = {
  async getTaskInsights(userId?: string | number): Promise<TaskInsightsResponse> {
    const resolvedUserId =
      userId ?? window.localStorage.getItem("userId");

    if (!resolvedUserId) {
      throw new Error("User not logged in");
    }

    const response = await fetch(
      `${API_BASE_URL}/statistics/task-insights?user_id=${resolvedUserId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },
};

export const notificationAPI = {
  async getSettings(userId?: string | number): Promise<NotificationSettings> {
    const resolvedUserId = userId ?? window.localStorage.getItem("userId");
    if (!resolvedUserId) {
      throw new Error("User not logged in");
    }

    const response = await fetch(
      `${API_BASE_URL}/notification-settings?user_id=${resolvedUserId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },

  async updateSettings(
    payload: NotificationSettingsUpdatePayload,
    userId?: string | number,
  ): Promise<NotificationSettings> {
    const resolvedUserId = userId ?? window.localStorage.getItem("userId");
    if (!resolvedUserId) {
      throw new Error("User not logged in");
    }

    const response = await fetch(
      `${API_BASE_URL}/notification-settings?user_id=${resolvedUserId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },
};

export const googleCalendarAPI = {
  async getConnectUrl(userId: number): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE_URL}/integrations/google-calendar/connect-url?user_id=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },

  async exchangeCode(userId: number, code: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/integrations/google-calendar/exchange-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, code }),
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },

  async syncAll(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/integrations/google-calendar/sync-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },

  async disconnect(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/integrations/google-calendar/disconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    return response.json();
  },
};
