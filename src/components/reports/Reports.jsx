import React, { useState } from "react";
import {
  Download,
  ShieldCheck,
  ClipboardCheck,
  Users,
  PowerOff,
} from "lucide-react";
import { useAccessControl } from "../../context/useAccessControl";
import { MODULES_CONFIG, ALL_ACTIONS } from "../../data/mockData";
import "./Reports.css";

export default function Reports() {
  const { roles, users, notify } = useAccessControl();
  const [activeReport, setActiveReport] = useState("summary");

  function exportRoleSummary() {
    const headers = [
      "Role ID",
      "Role Name",
      "Description",
      "Status",
      "Branch Scope",
      "Approval Level",
      "Approval Limit (₹)",
      "Assigned Users",
      "Created Date",
    ];
    const rows = roles.map((r) => [
      r.id,
      r.name,
      r.description,
      r.status,
      r.scope,
      `Level ${r.level}`,
      r.limit ? r.limit : "Unlimited",
      r.users,
      r.createdDate || "2026-01-10",
    ]);

    downloadCSV(headers, rows, "role-summary-report");
  }

  function exportPermissionMatrix() {
    const headers = ["Module", "Action", ...roles.map((r) => r.name)];
    const rows = [];
    Object.entries(MODULES_CONFIG).forEach(([mod, cfg]) => {
      ALL_ACTIONS.forEach((act) => {
        if (cfg.allowedActions.includes(act)) {
          const roleCols = roles.map((r) =>
            (r.permissions?.[mod] || []).includes(act) ? "GRANTED" : "DENIED"
          );
          rows.push([mod, act, ...roleCols]);
        }
      });
    });

    downloadCSV(headers, rows, "permission-matrix-report");
  }

  function exportRoleAssignments() {
    const headers = [
      "User ID",
      "Full Name",
      "Email Address",
      "Assigned Role",
      "Branch Office",
      "User Status",
    ];
    const rows = users.map((u) => [
      u.id,
      u.name,
      u.email,
      u.roleName,
      u.branch,
      u.status,
    ]);

    downloadCSV(headers, rows, "role-assignment-report");
  }

  function exportInactiveRoles() {
    const inactiveRoles = roles.filter((r) => r.status === "Inactive");
    const headers = [
      "Role ID",
      "Role Name",
      "Branch Scope",
      "Approval Level",
      "Users Assigned",
      "Created Date",
      "Compliance Status",
    ];
    const rows = inactiveRoles.map((r) => [
      r.id,
      r.name,
      r.scope,
      r.level,
      r.users,
      r.createdDate,
      r.users > 0 ? "VIOLATION (Users assigned to inactive role)" : "COMPLIANT",
    ]);

    downloadCSV(headers, rows, "inactive-roles-report");
  }

  function downloadCSV(headers, rows, filename) {
    const content = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify(`Report exported successfully as ${filename}.csv`);
  }

  const inactiveRoles = roles.filter((r) => r.status === "Inactive");

  return (
    <div className="secondary-page reports-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SECTION 20 · SYSTEM REPORTS</div>
          <h1>Access Control Compliance Reports</h1>
          <p className="secondary-description">
            Generate and export regulatory audit reports for role configurations and user authorization mappings.
          </p>
        </div>
      </div>

      {/* 4 Report Selector Cards */}
      <div className="reports-selection-grid">
        <div
          className={`report-selector-card ${activeReport === "summary" ? "active" : ""}`}
          onClick={() => setActiveReport("summary")}
        >
          <div className="report-card-icon violet">
            <ShieldCheck size={20} />
          </div>
          <div className="report-card-info">
            <strong>Role Summary Report</strong>
            <p>Comprehensive register of all roles, scopes, levels, and user counts.</p>
          </div>
          <button
            className="card-dl-btn"
            onClick={(e) => {
              e.stopPropagation();
              exportRoleSummary();
            }}
            title="Download CSV"
          >
            <Download size={15} />
          </button>
        </div>

        <div
          className={`report-selector-card ${activeReport === "matrix" ? "active" : ""}`}
          onClick={() => setActiveReport("matrix")}
        >
          <div className="report-card-icon blue">
            <ClipboardCheck size={20} />
          </div>
          <div className="report-card-info">
            <strong>Permission Matrix Report</strong>
            <p>Full cross-tabulation of roles by module action permissions.</p>
          </div>
          <button
            className="card-dl-btn"
            onClick={(e) => {
              e.stopPropagation();
              exportPermissionMatrix();
            }}
            title="Download CSV"
          >
            <Download size={15} />
          </button>
        </div>

        <div
          className={`report-selector-card ${activeReport === "assignments" ? "active" : ""}`}
          onClick={() => setActiveReport("assignments")}
        >
          <div className="report-card-icon green">
            <Users size={20} />
          </div>
          <div className="report-card-info">
            <strong>Role Assignment Report</strong>
            <p>Active mapping of all system users to their designated roles and branches.</p>
          </div>
          <button
            className="card-dl-btn"
            onClick={(e) => {
              e.stopPropagation();
              exportRoleAssignments();
            }}
            title="Download CSV"
          >
            <Download size={15} />
          </button>
        </div>

        <div
          className={`report-selector-card ${activeReport === "inactive" ? "active" : ""}`}
          onClick={() => setActiveReport("inactive")}
        >
          <div className="report-card-icon orange">
            <PowerOff size={20} />
          </div>
          <div className="report-card-info">
            <strong>Inactive Roles Report</strong>
            <p>Disabled or decommissioned roles check for compliance assurance.</p>
          </div>
          <button
            className="card-dl-btn"
            onClick={(e) => {
              e.stopPropagation();
              exportInactiveRoles();
            }}
            title="Download CSV"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Active Report Preview Table */}
      <section className="content-card report-preview-card">
        {/* Report 1 Preview: Role Summary */}
        {activeReport === "summary" && (
          <>
            <div className="card-heading">
              <div>
                <h3>Role Summary Preview</h3>
                <p>Showing {roles.length} total defined roles.</p>
              </div>
              <button className="primary-button" onClick={exportRoleSummary}>
                <Download size={15} /> Export Role Summary CSV
              </button>
            </div>
            <div className="table-scroll">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>ROLE NAME</th>
                    <th>BRANCH SCOPE</th>
                    <th>APPROVAL LEVEL</th>
                    <th>APPROVAL LIMIT</th>
                    <th>USERS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.name}</strong>
                      </td>
                      <td>{r.scope}</td>
                      <td>Level {r.level}</td>
                      <td>{r.limit ? `₹${Number(r.limit).toLocaleString()}` : "Unlimited"}</td>
                      <td>{r.users}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            r.status === "Active" ? "status-active" : "status-inactive"
                          }`}
                        >
                          <span />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Report 2 Preview: Permission Matrix */}
        {activeReport === "matrix" && (
          <>
            <div className="card-heading">
              <div>
                <h3>Permission Matrix Preview</h3>
                <p>Matrix representation across 8 modules and 6 actions.</p>
              </div>
              <button className="primary-button" onClick={exportPermissionMatrix}>
                <Download size={15} /> Export Permission Matrix CSV
              </button>
            </div>
            <div className="table-scroll">
              <table className="permission-table">
                <thead>
                  <tr>
                    <th>MODULE</th>
                    <th>ACTION</th>
                    {roles.map((r) => (
                      <th key={r.id}>{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(MODULES_CONFIG).flatMap(([mod, cfg]) =>
                    cfg.allowedActions.map((act) => (
                      <tr key={`${mod}-${act}`}>
                        <td>
                          <strong>{mod}</strong>
                        </td>
                        <td>{act}</td>
                        {roles.map((r) => {
                          const hasIt = (r.permissions?.[mod] || []).includes(act);
                          return (
                            <td key={r.id} style={{ textAlign: "center" }}>
                              {hasIt ? (
                                <span style={{ color: "var(--success)", fontWeight: 700 }}>
                                  GRANTED
                                </span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>DENIED</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Report 3 Preview: Role Assignments */}
        {activeReport === "assignments" && (
          <>
            <div className="card-heading">
              <div>
                <h3>Role Assignment Preview</h3>
                <p>Listing {users.length} user access allocations.</p>
              </div>
              <button className="primary-button" onClick={exportRoleAssignments}>
                <Download size={15} /> Export Assignment CSV
              </button>
            </div>
            <div className="table-scroll">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>USER NAME</th>
                    <th>EMAIL</th>
                    <th>ASSIGNED ROLE</th>
                    <th>BRANCH</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge-role">{u.roleName}</span>
                      </td>
                      <td>{u.branch}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Report 4 Preview: Inactive Roles */}
        {activeReport === "inactive" && (
          <>
            <div className="card-heading">
              <div>
                <h3>Inactive Roles Audit</h3>
                <p>Showing {inactiveRoles.length} disabled roles.</p>
              </div>
              <button className="primary-button" onClick={exportInactiveRoles}>
                <Download size={15} /> Export Inactive Roles CSV
              </button>
            </div>
            {inactiveRoles.length === 0 ? (
              <div className="empty-state-card">
                <p>All roles are currently active. No inactive roles to report.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>ROLE NAME</th>
                      <th>DESCRIPTION</th>
                      <th>ASSIGNED USERS</th>
                      <th>COMPLIANCE STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveRoles.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.name}</strong>
                        </td>
                        <td>{r.description}</td>
                        <td>{r.users} users</td>
                        <td>
                          {r.users > 0 ? (
                            <span className="badge-danger">
                              Violation: Users assigned to inactive role
                            </span>
                          ) : (
                            <span className="badge-success">
                              Compliant (0 users assigned)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
