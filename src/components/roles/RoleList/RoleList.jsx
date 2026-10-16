import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Power,
  Users,
  GitBranch,
  Building2,
  Plus,
  Download,
  Search,
  X,
  Eye,
  Pencil,
  Copy,
  Trash2,
  MoreHorizontal,
  ClipboardCheck,
} from "lucide-react";
import { useAccessControl } from "../../../context/useAccessControl";
import StatCard from "../../common/StatCard/StatCard";
import "./RoleList.css";

export default function RoleList({ onOpenCreate, onOpenEdit }) {
  const {
    roles,
    activeRolesCount,
    totalUsersCount,
    setSelectedRoleId,
    navigate,
    cloneRole,
    toggleRoleStatus,
    deleteRole,
    notify,
  } = useAccessControl();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [scopeFilter, setScopeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");
  const [actionMenuRoleId, setActionMenuRoleId] = useState(null);

  const filteredRoles = useMemo(() => {
    return roles
      .filter((role) => {
        const matchesSearch =
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "All" || role.status === statusFilter;
        const matchesScope =
          scopeFilter === "All" || role.scope === scopeFilter;

        return matchesSearch && matchesStatus && matchesScope;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "date-desc") return (b.createdDate || "").localeCompare(a.createdDate || "");
        if (sortBy === "date-asc") return (a.createdDate || "").localeCompare(b.createdDate || "");
        if (sortBy === "users-desc") return b.users - a.users;
        return 0;
      });
  }, [roles, searchTerm, statusFilter, scopeFilter, sortBy]);

  function exportRolesListCSV() {
    const headers = [
      "Role Name",
      "Description",
      "Users Assigned",
      "Status",
      "Branch Scope",
      "Approval Level",
      "Approval Limit",
      "Created Date",
    ];
    const rows = filteredRoles.map((r) => [
      r.name,
      r.description,
      r.users,
      r.status,
      r.scope,
      `Level ${r.level}`,
      r.limit ? r.limit : "Unlimited",
      r.createdDate || "2026-01-10",
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rbac-roles-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Roles list exported to CSV.");
  }

  return (
    <>
      {/* Header */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">RBAC-001 ROLE REPOSITORY</div>
          <h1>Role Management</h1>
          <p>
            Create reusable roles, define module access permissions, and enforce least-privilege security boundaries.
          </p>
        </div>
        <div className="page-heading-actions">
          <button className="primary-button" onClick={onOpenCreate}>
            <Plus size={18} /> Create Reusable Role
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <section className="stats-grid">
        <StatCard
          icon={ShieldCheck}
          label="Total Defined Roles"
          value={roles.length}
          note="Configured templates"
          tone="violet"
        />
        <StatCard
          icon={Power}
          label="Active Roles"
          value={activeRolesCount}
          note={`${roles.length - activeRolesCount} inactive role(s)`}
          tone="green"
        />
        <StatCard
          icon={Users}
          label="Staff Assigned"
          value={totalUsersCount}
          note="Across all branches"
          tone="blue"
        />
        <StatCard
          icon={GitBranch}
          label="Approval Tiers"
          value={`${new Set(roles.map((r) => r.level)).size} Levels`}
          note="Hierarchy tiers"
          tone="orange"
        />
      </section>

      {/* Main Roles Table Card */}
      <section className="content-card">
        <div className="card-heading">
          <div>
            <h2>Configured ERP Roles</h2>
            <p>
              Defined roles are assigned to users in PDD-003 to govern system-wide authorization.
            </p>
          </div>
          <button className="secondary-button" onClick={exportRolesListCSV}>
            <Download size={15} /> Export Roles CSV
          </button>
        </div>

        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search roles by title or keyword..."
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>

            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              aria-label="Filter scope"
            >
              <option value="All">All Branch Scopes</option>
              <option value="Assigned Branch">Assigned Branch Only</option>
              <option value="Selected Branches">Selected Branches</option>
              <option value="All Branches">All Branches</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort roles"
            >
              <option value="name-asc">Sort: Name (A to Z)</option>
              <option value="name-desc">Sort: Name (Z to A)</option>
              <option value="date-desc">Sort: Newest First</option>
              <option value="date-asc">Sort: Oldest First</option>
              <option value="users-desc">Sort: Most Users</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-scroll">
          <table className="roles-table">
            <thead>
              <tr>
                <th className="col-role-name">ROLE NAME</th>
                <th className="col-users">USERS</th>
                <th className="col-scope">BRANCH SCOPE</th>
                <th className="col-approval">APPROVAL</th>
                <th className="col-status">STATUS</th>
                <th className="col-created">CREATED DATE</th>
                <th className="col-actions actions-heading">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div className="role-name-cell">
                      <div className="role-avatar">{role.name.charAt(0)}</div>
                      <div className="role-name-text">
                        <div className="role-name-row">
                          <strong>{role.name}</strong>
                          {role.isProtected && (
                            <span className="protected-pill" title="Protected System Role">
                              System
                            </span>
                          )}
                        </div>
                        <span>{role.description || "No description"}</span>
                      </div>
                    </div>
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <div className="user-count">
                      <Users size={13} />
                      <span>{role.users}</span>
                    </div>
                  </td>

                  <td>
                    <span className="scope-label" title={role.scope}>
                      <Building2 size={13} />
                      {role.scope}
                      {role.scope === "Selected Branches" && (
                        <span className="branch-count-dot">
                          ({role.selectedBranches?.length || 0})
                        </span>
                      )}
                    </span>
                  </td>

                  <td>
                    <div className="approval-meta-cell">
                      <span className="approval-label">
                        Level {role.level}
                      </span>
                      {role.limit ? (
                        <span className="limit-sub">
                          ₹{Number(role.limit).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`status-pill ${
                        role.status === "Active" ? "status-active" : "status-inactive"
                      }`}
                    >
                      <span />
                      {role.status}
                    </span>
                  </td>

                  <td>
                    <span className="date-cell">
                      {role.createdDate || "2026-01-10"}
                    </span>
                  </td>

                  <td className="actions-cell">
                    <button
                      className="row-action"
                      title="View Details"
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        navigate("Role Details");
                      }}
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      className="row-action"
                      title="Edit Role"
                      onClick={() => onOpenEdit(role)}
                    >
                      <Pencil size={15} />
                    </button>

                    <div className="menu-wrap">
                      <button
                        className="row-action"
                        title="More Actions"
                        onClick={() =>
                          setActionMenuRoleId(
                            actionMenuRoleId === role.id ? null : role.id
                          )
                        }
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {actionMenuRoleId === role.id && (
                        <div className="action-menu">
                          <button
                            onClick={() => {
                              setSelectedRoleId(role.id);
                              navigate("Role Details");
                            }}
                          >
                            <Eye size={14} /> View Details
                          </button>
                          <button onClick={() => onOpenEdit(role)}>
                            <Pencil size={14} /> Edit Role
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRoleId(role.id);
                              navigate("Permission Matrix");
                            }}
                          >
                            <ClipboardCheck size={14} /> Matrix View
                          </button>
                          <button onClick={() => cloneRole(role)}>
                            <Copy size={14} /> Clone Role
                          </button>
                          <button onClick={() => toggleRoleStatus(role)}>
                            <Power size={14} />
                            {role.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                          {!role.isProtected && role.users === 0 && (
                            <button
                              className="delete-item-btn"
                              onClick={() => deleteRole(role)}
                            >
                              <Trash2 size={14} /> Delete Role
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No roles match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing <strong>{filteredRoles.length}</strong> of{" "}
            <strong>{roles.length}</strong> roles
          </span>
          <span>ERP Role-Based Access Control · Centralized Authorization</span>
        </div>
      </section>
    </>
  );
}
