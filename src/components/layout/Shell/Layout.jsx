import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import Toast from "../../common/Toast/Toast";
import { useAccessControl } from "../../../context/useAccessControl";
import "./Layout.css";

export default function Layout({ children }) {
  const { notice } = useAccessControl();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <Topbar />
        <div className="page-content">{children}</div>
        <footer className="page-footer">
          <span>
            Access Control (RBAC) Module <span>·</span> PDD-003 Authorization Engine
          </span>
          <span>Centralized ERP Role & Permission Governance</span>
        </footer>
      </main>
      <Toast notice={notice} />
    </div>
  );
}
