export const TEMP_USER_ID = 1;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getStoredUserId(): number {
  if (typeof window === "undefined") {
    return TEMP_USER_ID;
  }

  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      return TEMP_USER_ID;
    }

    const parsedUser = JSON.parse(rawUser);
    return typeof parsedUser?.id === "number" ? parsedUser.id : TEMP_USER_ID;
  } catch {
    return TEMP_USER_ID;
  }
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const config: RequestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// User APIs
export const userAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    apiCall("/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiCall("/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Assignment APIs
export const assignmentAPI = {
  create: (data: {
    user_id?: number;
    course_id?: number;
    course_name?: string;
    title: string;
    description: string;
    deadline: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
    score?: number;
    difficulty?: number;
  }) =>
    apiCall("/assignments", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        user_id: data.user_id ?? getStoredUserId(),
        priority: data.priority ?? "MEDIUM",
        status: data.status ?? "PENDING",
      }),
    }),

  getAll: (userId?: number) =>
    apiCall(`/assignments?user_id=${userId ?? getStoredUserId()}`, {
      method: "GET",
    }),

  getById: (id: number) =>
    apiCall(`/assignments/${id}`, {
      method: "GET",
    }),

  update: (
    id: number,
    data: { title?: string; description?: string; deadline?: string }
  ) =>
    apiCall(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/assignments/${id}`, {
      method: "DELETE",
    }),

  updateStatus: (id: number, status: string) =>
    apiCall(`/assignments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// Course APIs
export const courseAPI = {
  getAll: () =>
    apiCall("/courses", {
      method: "GET",
    }),

  getById: (id: number) =>
    apiCall(`/courses/${id}`, {
      method: "GET",
    }),
};

