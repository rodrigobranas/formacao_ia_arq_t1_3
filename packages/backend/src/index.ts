import "dotenv/config";
import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { db } from "./data/database";
import { authRoutes } from "./routes/authRoutes";
import { organizationRoutes } from "./routes/organizationRoutes";
import { publicTicketRoutes } from "./routes/publicTicketRoutes";
import { ticketRoutes } from "./routes/ticketRoutes";
import { ticketTypeRoutes } from "./routes/ticketTypeRoutes";
import { chatRoutes } from "./agents/chatRoutes";
import { dashboardRoutes } from "./routes/dashboardRoutes";
import { userRoutes } from "./routes/userRoutes";

export const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.use("/api", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/ticket-types", ticketTypeRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/public", publicTicketRoutes);

app.get(
  "/api/health",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.one<{ now: string }>("SELECT NOW()");
      res.json({ status: "ok", time: result.now });
    } catch (error) {
      next(error);
    }
  },
);

app.use(
  (_error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ status: "error" });
  },
);

if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  const shutdown = () => {
    server.close(() => {
      db.$pool.end();
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
