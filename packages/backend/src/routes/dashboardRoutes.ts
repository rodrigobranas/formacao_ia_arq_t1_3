import { Router, type NextFunction, type Request, type Response } from "express";
import {
  authMiddleware,
  type AuthenticatedRequest,
} from "../data/authMiddleware";
import { getDashboardMetrics } from "../services/dashboardService";

const VALID_PERIODS = ["7d", "30d", "90d"];

export const dashboardRoutes = Router();
dashboardRoutes.use(authMiddleware);

dashboardRoutes.get("/metrics", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const period = req.query.period as string | undefined;
    if (period && !VALID_PERIODS.includes(period)) {
      return res.status(400).json({ error: `Invalid period. Must be one of: ${VALID_PERIODS.join(", ")}` });
    }
    const metrics = await getDashboardMetrics(organizationId, period);
    return res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
});
