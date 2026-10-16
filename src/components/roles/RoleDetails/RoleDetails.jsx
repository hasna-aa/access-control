import React from "react";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Power,
  Trash2,
  Users,
  GitBranch,
  CheckCircle2,
  XCircle,
  Building2,
  ShieldCheck,
  Calendar,
  Layers,
  History,
} from "lucide-react";
import { useAccessControl } from "../../../context/useAccessControl";
import { MODULES_CONFIG, ALL_ACTIONS } from "../../../data/mockData";
import "./RoleDetails.css";

export default function RoleDetails({ onEdit }) {
  const {
    selectedRole: role,
    users,
    auditLogs,
    navigate,
    cloneRole,
    toggleRoleStatus,
    deleteRole,
    setSelectedRoleId,
  } = useAccessControl();

  if (!role) return null;

  const roleUsers = users.filter((u) => u.roleId === role.id);
  const roleLogs = auditLogs.filter((log) => log.roleName === role.name);

  const grantedCount = Object.values(role.permissions || {}).reduce(
    (acc, acts) => acc + (acts ? acts.length : 0),
    0
  );

  return (
    <div className="role-details-page">
      {/* Top navigation & action bar */}
      <div className="role-details-header">
        <button className="back-link-btn" onClick={() => navigate("Roles")}>
          <ArrowLeft size={16} /> Back to Role List
        </button>

        <div className="details-actions-bar">
          <button
            className="secondary-button"
            onClick={() => {
              setSelectedRoleId(role.id);
              navigate("Permission Matrix");
            }}
          >
            <ShieldCheck size={16} /> Open Permission Matrix
          </button>
          <button className="secondary-button" onClick={() => cloneRole(role)}>
            <Copy size={15} /> Clone Role
          </button>
          <button
            className="secondary-button"
            onClick={() => toggleRoleStatus(role)}
          >
            <Power size={15} />
            {role.status === "Active" ? "Deactivate" : "Activate"}
          </button>
          <button className="primary-button" onClick={() => onEdit(role)}>
            <Pencil size={15} /> Edit Role
          </button>
          {!role.isProtected && role.users === 0 && (
            <button
              className="danger-button"
              onClick={() => deleteRole(role)}
              title="Delete Role"
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Main role hero card */}
      <div className="role-hero-card">
        <div className="role-hero-left">
          <div className="hero-avatar">{role.name.charAt(0)}</div>
          <div className="hero-title-box">
            <div className="hero-eyebrow">
              RBAC-005 · ROLE DETAILS
              {role.isProtected && <span className="protected-tag">SYSTEM PROTECTED</span>}
            </div>
            <h2>{role.name}</h2>
            <p className="hero-desc">{role.description || "No description provided."}</p>
          </div>
        </div>

        <div className="hero-stats-box">
          <div className="hero-stat-pill">
            <span className="pill-title">Status</span>
            <span
              className={`status-pill ${
                role.status === "Active" ? "status-active" : "status-inactive"
              }`}
            >
              <span />
              {role.status}
            </span>
          </div>

          <div className="hero-stat-pill">
            <span className="pill-title">Assigned Users</span>
            <strong className="pill-value">
              <Users size={14} /> {roleUsers.length} users
            </strong>
          </div>

          <div className="hero-stat-pill">
            <span className="pill-title">Created Date</span>
            <span className="pill-subtext">
              <Calendar size={13} /> {role.createdDate || "2026-01-10"}
            </span>
          </div>
        </div>
      </div>

      {/* 4-Layer Specification Cards */}
      <div className="layers-overview-grid">
        <div className="layer-card">
          <div className="layer-num">LAYER 1</div>
          <div className="layer-title">
            <Layers size={16} /> Module Permissions
          </div>
          <div className="layer-value">{grantedCount} Actions Enabled</div>
          <p className="layer-desc">
            Active permissions across 8 ERP core business modules.
          </p>
        </div>

        <div className="layer-card">
          <div className="layer-num">LAYER 2</div>
          <div className="layer-title">
            <Building2 size={16} /> Branch Scope
          </div>
          <div className="layer-value">{role.scope}</div>
          <p className="layer-desc">
            {role.scope === "Assigned Branch"
              ? "Limited strictly to user's assigned branch office."
              : role.scope === "All Branches"
              ? "Full enterprise-wide access across all branches."
              : `${role.selectedBranches?.length || 0} designated branches permitted.`}
          </p>
          {role.scope === "Selected Branches" && role.selectedBranches?.length > 0 && (
            <div className="branch-chips-list">
              {role.selectedBranches.map((b) => (
                <span key={b} className="branch-chip">
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="layer-card">
          <div className="layer-num">LAYER 3</div>
          <div className="layer-title">
            <GitBranch size={16} /> Approval Authority
          </div>
          <div className="layer-value">Level {role.level}</div>
          <p className="layer-desc">
            {role.level === 0
              ? "Operational tier (no approval authority)."
              : role.level === 1
              ? "First-line verifier (Cashier / Accounts Officer)."
              : role.level === 2
              ? "Middle-tier authority (Branch Manager)."
              : "Executive / Head Office tier."}
          </p>
          {role.limit ? (
            <div className="approval-limit-badge">
              Max Approval: ₹{Number(role.limit).toLocaleString()}
            </div>
          ) : (
            <div className="approval-limit-badge subtle">No Limit Set</div>
          )}
        </div>
      </div>

      {/* Permission Matrix Section */}
      <section className="content-card section-card">
        <div className="card-heading">
          <div>
            <h3>Effective Permission Matrix</h3>
            <p>Module actions resolved for this role definition (Section 16).</p>
          </div>
          <button
            className="secondary-button small-button"
            onClick={() => {
              setSelectedRoleId(role.id);
              navigate("Permission Matrix");
            }}
          >
            Edit in Matrix
          </button>
        </div>

        <div className="table-scroll">
          <table className="permission-table details-perm-table">
            <thead>
              <tr>
                <th>MODULE</th>
                {ALL_ACTIONS.map((a) => (
                  <th key={a}>{a.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(MODULES_CONFIG).map(([modName, config]) => {
                const activeActs = role.permissions?.[modName] || [];
                return (
                  <tr key={modName}>
                    <td className="module-title-cell">
                      <strong>{modName}</strong>
                      <span className="module-desc-sub">{config.description}</span>
                    </td>
                    {ALL_ACTIONS.map((action) => {
                      const isAllowed = config.allowedActions.includes(action);
                      const hasPerm = activeActs.includes(action);

                      if (!isAllowed) {
                        return (
                          <td key={action} className="na-cell">
                            <span className="dash-na">-</span>
                          </td>
                        );
                      }

                      return (
                        <td key={action} className="perm-status-cell">
                          {hasPerm ? (
                            <span className="perm-granted" title="Granted">
                              <CheckCircle2 size={17} />
                            </span>
                          ) : (
                            <span className="perm-denied" title="Denied">
                              <XCircle size={17} />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assigned Users Section */}
      <section className="content-card section-card">
        <div className="card-heading">
          <div>
            <h3>Assigned Users ({roleUsers.length})</h3>
            <p>Users currently holding the "{role.name}" role (PDD-003 reference).</p>
          </div>
        </div>

        {roleUsers.length === 0 ? (
          <div className="empty-state-card">
            <Users size={32} />
            <p>No active users are currently assigned to this role.</p>
            <span>Users are mapped through the User Management module (PDD-003).</span>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ASSIGNED BRANCH</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {roleUsers.map((u) => (
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
                      <span className="scope-label">
                        <Building2 size={14} /> {u.branch}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Role Audit Trail */}
      <section className="content-card section-card">
        <div className="card-heading">
          <div>
            <h3>Audit History (Section 22)</h3>
            <p>Lifecycle mutations and changes recorded for this role.</p>
          </div>
        </div>

        {roleLogs.length === 0 ? (
          <div className="empty-state-card">
            <History size={32} />
            <p>No audit events logged yet for this role.</p>
          </div>
        ) : (
          <div className="audit-timeline">
            {roleLogs.map((log) => (
              <div key={log.id} className="audit-timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-top">
                    <span className="log-action-tag">{log.actionType}</span>
                    <span className="log-time">{log.timestamp}</span>
                  </div>
                  <p className="log-details">{log.details}</p>
                  <span className="log-actor">By: {log.actor}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
