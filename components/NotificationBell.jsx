import React, { useEffect, useState, useContext } from "react";
import { SocketContext } from "../context/SocketContext";
import api from "../api";

export default function NotificationBell() {
    const socket = useContext(SocketContext);
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            setNotifications((prev) => [
                {
                    id: Date.now(), // Fallback ID
                    ...notification,
                    is_read: false,
                    created_at: new Date().toISOString(),
                },
                ...prev,
            ]);
        };

        socket.on("new_notification", handleNewNotification);

        return () => {
            socket.off("new_notification", handleNewNotification);
        };
    }, [socket]);

    const loadNotifications = async () => {
        try {
            const res = await api.get("/notifications");
            setNotifications(res.data);
        } catch (err) {
            console.error("Error loading notifications:", err);
        }
    };

    const markRead = async (id) => {
        try {
            // FIXED: Added backticks for template literal
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (err) {
            console.error("Error marking read:", err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
        } catch (err) {
            console.error("Error marking all read:", err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            // FIXED: Added backticks for template literal
            await api.delete(`/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (err) {
            console.error("Delete Error:", err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const getIcon = (type) => {
        switch (type) {
            case "order": return "🛒";
            case "alert": return "⚠️";
            case "info": return "ℹ️";
            default: return "🔔";
        }
    };

    const timeAgo = (date) => {
        if (!date) return "";
        const messageDate = new Date(date);
        const now = new Date();
        const diffInMinutes = Math.floor((now - messageDate) / 60000);

        // If less than 1 minute old, show "Just now"
        if (diffInMinutes < 1) {
            return "Just now";
        }

        // Otherwise show the local time
        return messageDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="notification-container">
            <button className="notification-btn" onClick={() => setOpen(!open)}>
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {open && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h4>Notifications</h4>
                        <button onClick={markAllRead}>Mark all as read</button>
                    </div>

                    {notifications.length === 0 ? (
                        <p className="empty">No notifications</p>
                    ) : (
                        notifications.slice(0, 10).map((n) => (
                            <div key={n.id} className={`notification-item ${n.is_read ? "read" : "unread"}`} style={{ display: "flex", padding: "10px", borderBottom: "1px solid #ddd" }}>
                                <div style={{ display: "flex", flex: 1, cursor: "pointer" }} onClick={() => markRead(n.id)}>
                                    <div style={{ marginRight: "10px", fontSize: "20px" }}>{getIcon(n.type)}</div>
                                    <div className="content">
                                        <p style={{ margin: 0, fontWeight: n.is_read ? "normal" : "bold" }}>{n.message}</p>
                                        <small>{timeAgo(n.created_at)}</small>
                                    </div>
                                </div>
                                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>🗑️</button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}