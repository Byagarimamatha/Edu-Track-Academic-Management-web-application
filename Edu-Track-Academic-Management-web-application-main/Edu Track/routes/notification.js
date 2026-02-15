// routes/notification.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const notificationsPath = path.join(__dirname, "..", "notifications.json");

// Utility to read existing notifications
function getNotifications() {
  if (!fs.existsSync(notificationsPath)) {
    fs.writeFileSync(notificationsPath, "[]");
  }
  return JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
}

// ✅ GET all notifications
router.get("/", (req, res) => {
  try {
    const notifications = getNotifications();
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

// ✅ POST add new notification
router.post("/", (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  const newNotification = { id: Date.now(), title, message };
  const notifications = getNotifications();
  notifications.push(newNotification);

  fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2));
  res.json({ message: "✅ Notification saved successfully" });
});

// ✅ DELETE notification by ID
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== id);

  fs.writeFileSync(notificationsPath, JSON.stringify(filtered, null, 2));
  res.json({ message: "✅ Notification deleted" });
});

// ✅ PUT update notification by ID
router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, message } = req.body;
  let notifications = getNotifications();

  const index = notifications.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Notification not found" });
  }

  notifications[index] = { id, title, message };
  fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2));
  res.json({ message: "✅ Notification updated" });
});

module.exports = router;
