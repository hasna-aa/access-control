import React, { useState } from "react";
import { AccessControlProvider } from "./context/AccessControlContext";
import { useAccessControl } from "./context/useAccessControl";
import Layout from "./components/layout/Shell/Layout";
import RoleList from "./components/roles/RoleList/RoleList";
import RoleModal from "./components/roles/RoleModal/RoleModal";
import RoleDetails from "./components/roles/RoleDetails/RoleDetails";
import PermissionMatrix from "./components/permissions/PermissionMatrix";
import ApprovalLevels from "./components/approvals/ApprovalLevels";
import AuditLogs from "./components/audit/AuditLogs";
import Reports from "./components/reports/Reports";
import UserAssignments from "./components/users/UserAssignments";
import Dashboard from "./components/dashboard/Dashboard";
import ApiSpecModal from "./components/modals/ApiSpecModal";
import "./App.css";

function MainContent() {
  const { activePage, roles, saveRole, notify } = useAccessControl();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  function handleOpenCreate() {
    setEditingRole(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(role) {
    setEditingRole(role);
    setIsModalOpen(true);
  }

  function handleSaveRole(formData) {
    saveRole(formData, editingRole ? editingRole.id : null);
    setIsModalOpen(false);
  }

  return (
    <Layout>
      {activePage === "Roles" && (
        <RoleList
          onOpenCreate={handleOpenCreate}
          onOpenEdit={handleOpenEdit}
        />
      )}

      {activePage === "Role Details" && (
        <RoleDetails onEdit={handleOpenEdit} />
      )}

      {activePage === "Permission Matrix" && <PermissionMatrix />}

      {activePage === "Approval Levels" && (
        <ApprovalLevels onOpenEditModal={handleOpenEdit} />
      )}

      {activePage === "Audit Logs" && <AuditLogs />}

      {activePage === "Reports" && <Reports />}

      {activePage === "User Assignments" && <UserAssignments />}

      {activePage === "Dashboard" && (
        <Dashboard onOpenCreate={handleOpenCreate} />
      )}

      {/* Role Creation / Editing Modal (RBAC-002, RBAC-003, Section 14) */}
      <RoleModal
        key={editingRole ? `edit-${editingRole.id}` : `new-${isModalOpen}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRole}
        editingRole={editingRole}
        existingRoles={roles}
        notify={notify}
      />

      {/* Architecture & API Specification Modal (Sections 23 - 27 & Page 18) */}
      <ApiSpecModal />
    </Layout>
  );
}

export default function App() {
  return (
    <AccessControlProvider>
      <MainContent />
    </AccessControlProvider>
  );
}
