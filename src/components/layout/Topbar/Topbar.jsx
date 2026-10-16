import React from "react";
import { Menu, Code2, Database } from "lucide-react";
import { useAccessControl } from "../../../context/useAccessControl";
import NotificationDropdown from "../../common/NotificationDropdown/NotificationDropdown";
import "./Topbar.css";

export default function Topbar() {
  const { activePage, setMobileNav, setShowApiModal, isDbConnected, dbLoading } = useAccessControl();

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="mobile-menu icon-button"
          onClick={() => setMobileNav(true)}
          aria-label="Open menu"
        >
          <Menu size={21} />
        </button>
        <span>Access Control</span>
        <span className="breadcrumb-slash">/</span>
        <strong>{activePage}</strong>
      </div>

      <div className="topbar-right">
        <div
          className={`db-status-badge ${isDbConnected ? "connected" : dbLoading ? "loading" : "disconnected"}`}
          title={isDbConnected ? "Connected to MongoDB Atlas" : "MongoDB not connected - using local fallback"}
        >
          <Database size={13} />
          <span className="db-dot"></span>
          <span>{isDbConnected ? "MongoDB Atlas" : dbLoading ? "Connecting..." : "MongoDB Offline"}</span>
        </div>

        <button
          className="secondary-button spec-btn-top"
          onClick={() => setShowApiModal(true)}
        >
          <Code2 size={15} />
          <span>4-Layer Schema</span>
        </button>

        <NotificationDropdown />

        <div className="topbar-avatar" title="Logged in as Alex Morgan">
          AM
        </div>
      </div>
    </header>
  );
}
