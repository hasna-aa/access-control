import React from "react";
import { Menu, Code2 } from "lucide-react";
import { useAccessControl } from "../../../context/useAccessControl";
import NotificationDropdown from "../../common/NotificationDropdown/NotificationDropdown";
import "./Topbar.css";

export default function Topbar() {
  const { activePage, setMobileNav, setShowApiModal } = useAccessControl();

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
