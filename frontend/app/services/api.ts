const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    user_id: number;
    course_id: number;
    title: string;
    description: string;
    deadline: string;
  }) =>
    apiCall("/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () =>
    apiCall("/assignments", {
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
