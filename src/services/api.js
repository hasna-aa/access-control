const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Roles
  getRoles: () => request("/roles"),
  getRole: (id) => request(`/roles/${id}`),
  createRole: (data) =>
    request("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRole: (id, data) =>
    request(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteRole: (id) =>
    request(`/roles/${id}`, {
      method: "DELETE",
    }),

  // Users
  getUsers: () => request("/users"),
  getUser: (id) => request(`/users/${id}`),
  createUser: (data) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (id, data) =>
    request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: "DELETE",
    }),

  // Audit Logs
  getAuditLogs: () => request("/audit-logs"),
  getAuditLog: (id) => request(`/audit-logs/${id}`),
  createAuditLog: (data) =>
    request("/audit-logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteAuditLog: (id) =>
    request(`/audit-logs/${id}`, {
      method: "DELETE",
    }),

  // Notifications
  getNotifications: () => request("/notifications"),
  createNotification: (data) =>
    request("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  markNotificationsRead: () =>
    request("/notifications/mark-read", {
      method: "PUT",
    }),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: "PUT",
    }),
  deleteNotification: (id) =>
    request(`/notifications/${id}`, {
      method: "DELETE",
    }),

  // Reset to initial demo seeds
  resetDatabase: () =>
    request("/reset", {
      method: "POST",
    }),
};
