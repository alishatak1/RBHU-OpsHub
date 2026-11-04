import "dotenv/config";
import express from "express";
import chatRoutes from "./routes/chat.routes";
import authRoutes from "./routes/auth.routes";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import customerRoutes from "./routes/customer.routes";
import shipmentRoutes from "./routes/shipment.routes";
import announcementRoutes from "./routes/announcement.routes";
import { errorHandler } from "./middleware/error.middleware";
import { configureSockets } from "./sockets";
import { prisma } from "./config/prisma";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://rbhu-opshub-frontend-v2.onrender.com"
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.set("io", io);
configureSockets(io);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan("dev"));

const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "RBHU OpsHub API",
    version: "1.0.0",
    description: "REST API documentation for RBHU OpsHub",
  },
  servers: [{ url: "http://localhost:5000" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/setup": {
      post: {
        summary: "Create the first administrator",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 12 },
                },
                required: ["name", "email", "password"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Administrator created" },
          "403": { description: "Administrator already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Administrator login",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful; returns JWT token" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Get current administrator",
        responses: {
          "200": { description: "Administrator details" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/health": {
      get: {
        security: [],
        summary: "Health check",
        responses: { "200": { description: "API is healthy" } },
      },
    },
    "/api/db-test": {
      get: {
        security: [],
        summary: "Test database connection",
        responses: { "200": { description: "Database connected" } },
      },
    },
    "/api/customers": {
      get: {
        summary: "List customers",
        responses: { "200": { description: "Customers retrieved" } },
      },
      post: {
        summary: "Create customer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  company: { type: "string" },
                },
                required: ["name", "email"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Customer created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/customers/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        summary: "Get customer by ID",
        responses: {
          "200": { description: "Customer retrieved" },
          "404": { description: "Customer not found" },
        },
      },
      put: {
        summary: "Update customer",
        responses: {
          "200": { description: "Customer updated" },
          "404": { description: "Customer not found" },
        },
      },
      delete: {
        summary: "Soft-delete customer",
        responses: {
          "200": { description: "Customer deactivated" },
          "404": { description: "Customer not found" },
        },
      },
    },
    "/api/shipments": {
      get: {
        summary: "List shipments",
        responses: { "200": { description: "Shipments retrieved" } },
      },
      post: {
        summary: "Create shipment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  trackingNumber: { type: "string" },
                  origin: { type: "string" },
                  destination: { type: "string" },
                  customerId: { type: "string", format: "uuid" },
                },
                required: [
                  "trackingNumber",
                  "origin",
                  "destination",
                  "customerId",
                ],
              },
            },
          },
        },
        responses: {
          "201": { description: "Shipment created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/shipments/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        summary: "Get shipment by ID",
        responses: {
          "200": { description: "Shipment retrieved" },
          "404": { description: "Shipment not found" },
        },
      },
    },
    "/api/shipments/{id}/status": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      patch: {
        summary: "Update shipment status",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "PENDING",
                      "PROCESSING",
                      "IN_TRANSIT",
                      "DELIVERED",
                      "CANCELLED",
                    ],
                  },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Shipment status updated" },
          "400": { description: "Invalid status" },
        },
      },
    },
    "/api/announcements": {
      get: {
        security: [],
        summary: "List announcements",
        responses: { "200": { description: "Announcements retrieved" } },
      },
    },
    "/api/chat": {
      post: {
        summary: "Send message to AI assistant",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  history: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: { type: "string" },
                      },
                    },
                  },
                },
                required: ["message"],
              },
            },
          },
        },
        responses: {
          "200": { description: "AI response generated" },
          "400": { description: "Invalid request" },
          "503": { description: "AI service not configured" },
        },
      },
    },
  },
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "RBHU OpsHub API" });
});

app.get("/api/db-test", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "connected", database: "Neon PostgreSQL" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/api/customers", customerRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

httpServer.listen(PORT, () => {
  console.log(`RBHU OpsHub API running at http://localhost:${PORT}`);
  console.log(`API documentation: http://localhost:${PORT}/api-docs`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});
