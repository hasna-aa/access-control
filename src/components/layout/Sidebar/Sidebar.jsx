import React from "react";
import {
  ShieldCheck,
  ChevronDown,
  X,
  Code2,
  RefreshCw,
  LayoutDashboard,
  ClipboardCheck,
  GitBranch,
  History,
  FileText,
  Users,
} from "lucide-react";
import { useAccessControl } from "../../../context/useAccessControl";
import "./Sidebar.css";

export default function Sidebar() {
  const {
    activePage,
    navigate,
    mobileNav,
    setMobileNav,
    roles,
    auditLogs,
    users,
    setShowApiModal,
    resetDemoData,
  } = useAccessControl();

  const navGroups = [
    {
      label: "OVERVIEW",
      items: [{ name: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "ACCESS CONTROL (RBAC)",
      items: [
        { name: "Roles", icon: ShieldCheck, count: roles.length },
        { name: "Permission Matrix", icon: ClipboardCheck },
        { name: "Approval Levels", icon: GitBranch },
      ],
    },
    {
      label: "GOVERNANCE & AUDIT",
      items: [
        { name: "Audit Logs", icon: History, count: auditLogs.length },
        { name: "Reports", icon: FileText },
        { name: "User Assignments", icon: Users, count: users.length },
      ],
    },
  ];

  return (
    <>
      {mobileNav && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}

      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2>AccessHub</h2>
            <p>ERP RBAC MODULE</p>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        {/* Workspace Chip */}
        <div className="workspace">
          <div className="workspace-avatar">AC</div>
          <div className="workspace-info">
            <strong>Acme Enterprise ERP</strong>
            <span>Multi-Branch Authorization</span>
          </div>
          <ChevronDown size={15} />
        </div>

        {/* Navigation */}
        <nav className="side-navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-heading">{group.label}</p>
              {group.items.map(({ name, icon: Icon, count }) => (
                <button
                  key={name}
                  className={`nav-link ${activePage === name ? "nav-active" : ""}`}
                  onClick={() => navigate(name)}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{name}</span>
                  {count !== undefined && (
                    <span className="nav-count">{count}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="sidebar-bottom">
          <button
            className="nav-link spec-link"
            onClick={() => setShowApiModal(true)}
          >
            <Code2 size={17} />
            <span>API & Architecture Spec</span>
          </button>

          <button
            className="nav-link reset-demo-link"
            onClick={resetDemoData}
            title="Reset to factory seed data"
          >
            <RefreshCw size={15} />
            <span>Reset Demo Data</span>
          </button>

          <div className="profile">
            <div className="profile-avatar">AM</div>
            <div className="profile-info">
              <strong>Alex Morgan</strong>
              <span>System Administrator</span>
            </div>
            <ShieldCheck size={16} style={{ color: "var(--primary)" }} />
          </div>
        </div>
      </aside>
    </>
  );
}
