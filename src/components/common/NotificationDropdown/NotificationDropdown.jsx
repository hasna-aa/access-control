import React from "react";
import { Bell } from "lucide-react";
import { useAccessControl } from "../../../context/useAccessControl";
import "./NotificationDropdown.css";

export default function NotificationDropdown() {
  const {
    notifications,
    unreadNotificationsCount,
    showNotifications,
    setShowNotifications,
    markNotificationsRead,
  } = useAccessControl();

  return (
    <div className="notification-wrapper">
      <button
        className="icon-button notification-button"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadNotificationsCount > 0 && <span className="notif-dot" />}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notif-header">
            <strong>Activity Notifications</strong>
            {unreadNotificationsCount > 0 && (
              <button
                className="small-button"
                style={{ background: "transparent", border: 0, color: "var(--primary)", padding: 0 }}
                onClick={markNotificationsRead}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.unread ? "unread" : ""}`}
              >
                <div className="notif-title-row">
                  <strong>{n.title}</strong>
                  <span>{n.time}</span>
                </div>
                <p>{n.description}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="notif-empty">No notifications.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
