import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AccessControlContext } from "./accessControlContextInstance";
import {
  INITIAL_ROLES,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from "../data/mockData";
import { api } from "../services/api";

export function AccessControlProvider({ children }) {
  // Roles State
  const [roles, setRoles] = useState(() => {
    try {
      const saved = localStorage.getItem("accessHub_roles_v2");
      return saved ? JSON.parse(saved) : INITIAL_ROLES;
    } catch {
      return INITIAL_ROLES;
    }
  });

  // Users State
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("accessHub_users_v2");
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("accessHub_logs_v2");
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Notifications State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("accessHub_notifications_v2");
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Database Connection & Sync Status
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  // Navigation & UI state
  const [activePage, setActivePage] = useState("Roles");
  const [selectedRoleId, setSelectedRoleId] = useState(1);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  // Notifier
  const notify = useCallback((message, type = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 3500);
  }, []);

  // Fetch initial data from MongoDB API
  useEffect(() => {
    let isMounted = true;

    async function loadDataFromDb() {
      try {
        setDbLoading(true);
        const [fetchedRoles, fetchedUsers, fetchedLogs, fetchedNotifs] = await Promise.all([
          api.getRoles(),
          api.getUsers(),
          api.getAuditLogs(),
          api.getNotifications(),
        ]);

        if (isMounted) {
          if (Array.isArray(fetchedRoles) && fetchedRoles.length > 0) {
            setRoles(fetchedRoles);
          }
          if (Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
            setUsers(fetchedUsers);
          }
          if (Array.isArray(fetchedLogs)) {
            setAuditLogs(fetchedLogs);
          }
          if (Array.isArray(fetchedNotifs)) {
            setNotifications(fetchedNotifs);
          }
          setIsDbConnected(true);
        }
      } catch (err) {
        console.warn("[MongoDB] Could not load from MongoDB, falling back to local cache:", err.message);
        if (isMounted) {
          setIsDbConnected(false);
        }
      } finally {
        if (isMounted) {
          setDbLoading(false);
        }
      }
    }

    loadDataFromDb();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persistence effects in localStorage as offline backup
  useEffect(() => {
    localStorage.setItem("accessHub_roles_v2", JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem("accessHub_users_v2", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("accessHub_logs_v2", JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("accessHub_notifications_v2", JSON.stringify(notifications));
  }, [notifications]);

  // Derived: Roles with live user counts
  const rolesWithCounts = useMemo(() => {
    return roles.map((role) => ({
      ...role,
      users: users.filter((u) => u.roleId === role.id).length,
    }));
  }, [roles, users]);

  const activeRolesCount = rolesWithCounts.filter((r) => r.status === "Active").length;
  const totalUsersCount = users.length;
  const selectedRole = rolesWithCounts.find((r) => r.id === selectedRoleId) || rolesWithCounts[0];
  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  // Record Audit Event & Trigger Notification
  async function recordAuditEvent(actionType, roleName, details) {
    const now = new Date();
    const timestamp = now.toISOString().replace("T", " ").slice(0, 19);

    const newLog = {
      id: Date.now(),
      timestamp,
      actor: "Alex Morgan (System Administrator)",
      actionType,
      roleName,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    const newNotice = {
      id: Date.now(),
      title: actionType,
      description: `${roleName}: ${details}`,
      time: "Just now",
      unread: true,
    };
    setNotifications((prev) => [newNotice, ...prev]);

    // Sync to MongoDB in background
    try {
      await Promise.all([
        api.createAuditLog(newLog),
        api.createNotification(newNotice),
      ]);
    } catch (e) {
      console.error("[MongoDB] Failed to sync audit log/notification:", e);
    }
  }

  // Navigation
  function navigate(page) {
    setActivePage(page);
    setMobileNav(false);
  }

  // Save Role (Create or Edit)
  async function saveRole(formData, editingId = null) {
    if (editingId) {
      setRoles((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...formData } : r))
      );
      recordAuditEvent(
        "Role Updated",
        formData.name,
        `Updated configuration: Scope=${formData.scope}, Level=${formData.level}, Status=${formData.status}.`
      );
      notify(`Role "${formData.name}" updated successfully.`);

      try {
        await api.updateRole(editingId, formData);
      } catch (err) {
        console.error("[MongoDB] Update role error:", err);
      }
    } else {
      const nextId = Math.max(0, ...roles.map((r) => r.id)) + 1;
      const today = new Date().toISOString().slice(0, 10);
      const newRole = {
        id: nextId,
        ...formData,
        users: 0,
        createdDate: today,
        isProtected: false,
      };

      setRoles((prev) => [...prev, newRole]);
      setSelectedRoleId(nextId);
      recordAuditEvent(
        "Role Created",
        formData.name,
        `Created role with ${formData.scope} scope and Level ${formData.level} approval authority.`
      );
      notify(`Role "${formData.name}" created successfully.`);

      try {
        const saved = await api.createRole(newRole);
        if (saved && saved.id) {
          setRoles((prev) => prev.map((r) => (r.id === nextId ? saved : r)));
        }
      } catch (err) {
        console.error("[MongoDB] Create role error:", err);
      }
    }
  }

  // Clone Role (RBAC-006)
  async function cloneRole(role) {
    const nextId = Math.max(0, ...roles.map((r) => r.id)) + 1;
    const clonedName = `${role.name} Copy`;
    const today = new Date().toISOString().slice(0, 10);

    const cloned = {
      ...role,
      id: nextId,
      name: clonedName,
      status: "Inactive",
      users: 0,
      createdDate: today,
      isProtected: false,
      permissions: JSON.parse(JSON.stringify(role.permissions || {})),
    };

    setRoles((prev) => [...prev, cloned]);
    recordAuditEvent(
      "Role Created",
      clonedName,
      `Cloned template from "${role.name}" as inactive role.`
    );
    notify(`Role "${role.name}" cloned as "${clonedName}" (Inactive).`);

    try {
      await api.createRole(cloned);
    } catch (err) {
      console.error("[MongoDB] Clone role error:", err);
    }
  }

  // Toggle Active/Inactive (FR-004, FR-005)
  async function toggleRoleStatus(role) {
    if (role.name === "System Administrator" && role.status === "Active") {
      const activeAdmins = roles.filter(
        (r) => r.name === "System Administrator" && r.status === "Active"
      );
      if (activeAdmins.length <= 1) {
        notify("At least one active System Administrator must always exist (Business Rule 17).", "error");
        return;
      }
    }

    const nextStatus = role.status === "Active" ? "Inactive" : "Active";
    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, status: nextStatus } : r))
    );

    const action = nextStatus === "Active" ? "Role Activated" : "Role Deactivated";
    recordAuditEvent(action, role.name, `Role status changed to ${nextStatus}.`);
    notify(`Role "${role.name}" is now ${nextStatus}.`);

    try {
      await api.updateRole(role.id, { status: nextStatus });
    } catch (err) {
      console.error("[MongoDB] Status toggle error:", err);
    }
  }

  // Delete Role
  async function deleteRole(role) {
    if (role.isProtected || role.name === "System Administrator") {
      notify("System Administrator role is protected and cannot be deleted.", "error");
      return;
    }

    if (role.users > 0) {
      notify(
        `Cannot delete role "${role.name}": Assigned to ${role.users} user(s). Deactivate instead.`,
        "error"
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"? This cannot be undone.`)) {
      return;
    }

    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    recordAuditEvent("Role Updated", role.name, "Deleted decommissioned role definition.");
    notify(`Role "${role.name}" deleted.`);
    if (activePage === "Role Details") {
      setActivePage("Roles");
    }

    try {
      await api.deleteRole(role.id);
    } catch (err) {
      console.error("[MongoDB] Delete role error:", err);
    }
  }

  // Save Permissions (RBAC-004)
  async function saveRolePermissions(roleId, newPermissions) {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, permissions: newPermissions } : r))
    );

    recordAuditEvent("Permission Modified", role.name, "Updated module action permission matrix.");
    notify(`Permissions for "${role.name}" saved successfully.`);

    try {
      await api.updateRole(roleId, { permissions: newPermissions });
    } catch (err) {
      console.error("[MongoDB] Save permissions error:", err);
    }
  }

  // Partial update role (e.g., approval levels)
  async function updateRole(roleId, updates) {
    const target = roles.find((r) => r.id === roleId);
    if (!target) return;

    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, ...updates } : r))
    );

    if (updates.level !== undefined || updates.limit !== undefined) {
      recordAuditEvent(
        "Approval Level Changed",
        target.name,
        `Configured approval Level ${updates.level}${updates.limit ? `, limit ₹${updates.limit}` : ""}.`
      );
    }
    notify(`Role "${target.name}" updated successfully.`);

    try {
      await api.updateRole(roleId, updates);
    } catch (err) {
      console.error("[MongoDB] Update role error:", err);
    }
  }

  // Assign user to role
  async function assignUserRole(userId, newRole) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, roleId: newRole.id, roleName: newRole.name } : u
      )
    );
    const assignedUser = users.find((u) => u.id === userId);
    recordAuditEvent(
      "Role Updated",
      newRole.name,
      `Assigned user "${assignedUser?.name}" to role "${newRole.name}".`
    );
    notify(`User "${assignedUser?.name}" assigned to "${newRole.name}".`);

    try {
      await api.updateUser(userId, { roleId: newRole.id, roleName: newRole.name });
    } catch (err) {
      console.error("[MongoDB] Assign user error:", err);
    }
  }

  // Reset Demo Data
  async function resetDemoData() {
    if (window.confirm("Reset all roles, permissions, and audit logs to factory demonstration seed data in MongoDB?")) {
      try {
        const result = await api.resetDatabase();
        if (result.roles) setRoles(result.roles);
        if (result.users) setUsers(result.users);
        if (result.auditLogs) setAuditLogs(result.auditLogs);
        if (result.notifications) setNotifications(result.notifications);
        setSelectedRoleId(1);
        notify("MongoDB database restored to defaults.");
      } catch (err) {
        console.warn("[MongoDB] Reset via API failed, resetting locally:", err);
        localStorage.removeItem("accessHub_roles_v2");
        localStorage.removeItem("accessHub_users_v2");
        localStorage.removeItem("accessHub_logs_v2");
        localStorage.removeItem("accessHub_notifications_v2");
        setRoles(INITIAL_ROLES);
        setUsers(INITIAL_USERS);
        setAuditLogs(INITIAL_AUDIT_LOGS);
        setNotifications(INITIAL_NOTIFICATIONS);
        setSelectedRoleId(1);
        notify("Demo data restored to defaults.");
      }
    }
  }

  // Mark all notifications read
  async function markNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await api.markNotificationsRead();
    } catch (err) {
      console.error("[MongoDB] Mark notifications read error:", err);
    }
  }

  const value = {
    roles: rolesWithCounts,
    rawRoles: roles,
    users,
    auditLogs,
    notifications,
    activePage,
    selectedRoleId,
    selectedRole,
    activeRolesCount,
    totalUsersCount,
    unreadNotificationsCount,
    mobileNav,
    notice,
    showNotifications,
    showApiModal,
    isDbConnected,
    dbLoading,
    setMobileNav,
    setSelectedRoleId,
    setShowNotifications,
    setShowApiModal,
    notify,
    navigate,
    saveRole,
    cloneRole,
    toggleRoleStatus,
    deleteRole,
    saveRolePermissions,
    updateRole,
    assignUserRole,
    resetDemoData,
    markNotificationsRead,
  };

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
}
