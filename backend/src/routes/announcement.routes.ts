import { Router } from "express";

const router = Router();

const announcements = [
  {
    id: "ANN-001",
    title: "Welcome to RBHU OpsHub",
    message: "The new Operations Management Platform is now available for managing customers and tracking shipments.",
    category: "Platform Update",
    priority: "high",
    publishedAt: "2026-11-02T09:00:00.000Z",
    pinned: true
  },
  {
    id: "ANN-002",
    title: "Shipment Tracking Update",
    message: "Shipment status updates are now broadcast in real time. Keep your shipment records updated.",
    category: "Operations",
    priority: "medium",
    publishedAt: "2026-11-02T10:30:00.000Z",
    pinned: true
  },
  {
    id: "ANN-003",
    title: "Analytics Dashboard Available",
    message: "Upload your sales CSV file to view regional revenue and top salesperson analytics.",
    category: "Feature",
    priority: "low",
    publishedAt: "2026-11-01T08:00:00.000Z",
    pinned: false
  }
];

router.get("/", (_req, res) => {
  res.json({
    success: true,
    count: announcements.length,
    data: announcements
  });
});

export default router;
