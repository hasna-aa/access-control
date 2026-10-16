import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  History,
  Plus,
  ClipboardCheck,
  GitBranch,
  FileText,
  Code2,
} from "lucide-react";
import { useAccessControl } from "../../context/useAccessControl";
import StatCard from "../common/StatCard/StatCard";
import "./Dashboard.css";

export default function Dashboard({ onOpenCreate }) {
  const {
    roles,
    activeRolesCount,
    totalUsersCount,
    auditLogs,
    navigate,
    setShowApiModal,
  } = useAccessControl();

  return (
    <div className="secondary-page dashboard-page">
      <div className="eyebrow">EXECUTIVE OVERVIEW</div>
      <h1>Access Control Center</h1>
      <p className="secondary-description">
        High-level authorization posture, role distributions, and compliance readiness across all branches.
      </p>

      {/* Metric Cards */}
      <div className="stats-grid">
        <StatCard
          icon={ShieldCheck}
          label="Defined Roles"
          value={roles.length}
          note="Reusable templates"
          tone="violet"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Roles"
          value={activeRolesCount}
          note="100% policy audited"
          tone="green"
        />
        <StatCard
          icon={Users}
          label="Mapped Users"
          value={totalUsersCount}
          note="Staff authorizations"
          tone="blue"
        />
        <StatCard
          icon={History}
          label="Audit Events"
          value={auditLogs.length}
          note="Recorded mutations"
          tone="orange"
        />
      </div>

      {/* Quick Jump Shortcuts */}
      <section className="content-card dashboard-shortcuts">
        <h2>Quick Administration Actions</h2>
        <button className="primary-button" onClick={onOpenCreate}>
          <Plus size={16} /> Create Reusable Role
        </button>
        <button
          className="secondary-button"
          onClick={() => navigate("Permission Matrix")}
        >
          <ClipboardCheck size={16} /> Open Permission Matrix
        </button>
        <button
          className="secondary-button"
          onClick={() => navigate("Approval Levels")}
        >
          <GitBranch size={16} /> View Approval Escalation
        </button>
        <button
          className="secondary-button"
          onClick={() => navigate("Reports")}
        >
          <FileText size={16} /> Generate Compliance Reports
        </button>
        <button
          className="secondary-button"
          onClick={() => setShowApiModal(true)}
        >
          <Code2 size={16} /> View API Schema & 4-Layer Spec
        </button>
      </section>

      {/* Recent Audit Stream */}
      <section className="content-card section-card">
        <div className="card-heading">
          <div>
            <h3>Recent Security Audit Stream</h3>
            <p>Live feed of role modifications and authorization events.</p>
          </div>
          <button
            className="secondary-button small-button"
            onClick={() => navigate("Audit Logs")}
          >
            View All Logs ({auditLogs.length})
          </button>
        </div>
        <div className="table-scroll">
          <table className="roles-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>ACTION</th>
                <th>ROLE</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 5).map((log) => (
                <tr key={log.id}>
                  <td className="timestamp-cell">
                    <span className="mono-time">{log.timestamp}</span>
                  </td>
                  <td>
                    <span className="log-action-tag">{log.actionType}</span>
                  </td>
                  <td>
                    <strong>{log.roleName}</strong>
                  </td>
                  <td>
                    <span className="details-text">{log.details}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
