import React, { useState } from "react";
import {
  Search,
  ShieldCheck,
  Building2,
  Check,
  X,
  Eye,
  Pencil,
} from "lucide-react";
import { useAccessControl } from "../../context/useAccessControl";
import "./UserAssignments.css";

export default function UserAssignments() {
  const {
    users,
    roles,
    assignUserRole,
    setSelectedRoleId,
    navigate,
    notify,
  } = useAccessControl();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRoleId, setLocalSelectedRoleId] = useState("");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.branch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "All" || u.roleName === roleFilter;

    return matchesSearch && matchesRole;
  });

  function startReassign(u) {
    setEditingUser(u);
    setLocalSelectedRoleId(u.roleId);
  }

  function handleSaveAssignment(e) {
    e.preventDefault();
    if (!editingUser) return;

    const targetRole = roles.find((r) => r.id === Number(selectedRoleId));
    if (!targetRole) {
      notify("Please select a valid role.", "error");
      return;
    }

    if (targetRole.status === "Inactive") {
      notify("Business Rule: Inactive roles cannot be assigned to users.", "error");
      return;
    }

    assignUserRole(editingUser.id, targetRole);
    setEditingUser(null);
  }

  return (
    <div className="secondary-page users-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PDD-003 INTEGRATION · USER ASSIGNMENTS</div>
          <h1>User Role Assignments</h1>
          <p className="secondary-description">
            Assign reusable roles to organization staff members to enforce least-privilege access and branch boundaries.
          </p>
        </div>
      </div>

      <section className="content-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search users by name, email, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table className="roles-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>ASSIGNED ROLE</th>
                <th>EFFECTIVE BRANCH SCOPE</th>
                <th>APPROVAL AUTHORITY</th>
                <th>STATUS</th>
                <th className="actions-heading">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const userRole = roles.find((r) => r.id === u.roleId);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="role-name-cell">
                        <div className="role-avatar">{u.name.charAt(0)}</div>
                        <div className="role-name-text">
                          <strong>{u.name}</strong>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-role">
                        <ShieldCheck size={13} /> {u.roleName}
                      </span>
                    </td>
                    <td>
                      <span className="scope-label">
                        <Building2 size={13} />
                        {userRole ? userRole.scope : u.branch}
                      </span>
                    </td>
                    <td>
                      <span className="approval-label">
                        Level {userRole?.level ?? 0}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          u.status === "Active" ? "status-active" : "status-inactive"
                        }`}
                      >
                        <span />
                        {u.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="row-action"
                        title="Reassign Role"
                        onClick={() => startReassign(u)}
                      >
                        <Pencil size={15} />
                      </button>
                      {userRole && (
                        <button
                          className="row-action"
                          title="View Role Details"
                          onClick={() => {
                            setSelectedRoleId(userRole.id);
                            navigate("Role Details");
                          }}
                        >
                          <Eye size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reassign Modal */}
      {editingUser && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingUser(null);
          }}
        >
          <div className="role-modal small-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <div className="eyebrow">REASSIGN USER ROLE</div>
                <h3>{editingUser.name}</h3>
                <p>Change assigned role for this user account (PDD-003).</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setEditingUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment}>
              <div className="modal-body">
                <div className="field-label">
                  <label htmlFor="user-target-role">Select New Role</label>
                  <select
                    id="user-target-role"
                    value={selectedRoleId}
                    onChange={(e) => setLocalSelectedRoleId(e.target.value)}
                    required
                  >
                    {roles.map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                        disabled={r.status === "Inactive"}
                      >
                        {r.name} ({r.status}) - Level {r.level} · {r.scope}
                        {r.status === "Inactive" ? " [CANNOT ASSIGN - INACTIVE]" : ""}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">
                    Business Rule: Inactive roles are disabled and cannot be assigned.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Check size={16} /> Update Role Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
