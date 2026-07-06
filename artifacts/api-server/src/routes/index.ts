import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import tenantsRouter from "./tenants";
import hubsRouter from "./hubs";
import logsRouter from "./logs";
import metricsRouter from "./metrics";
import habitsRouter from "./habits";
import projectsRouter from "./projects";
import calendarRouter from "./calendar";
import systemStateRouter from "./systemState";
import notificationsRouter from "./notifications";
import automationRouter from "./automation";
import insightsRouter from "./insights";
import adminRouter from "./admin";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureProfileMiddleware } from "../middlewares/ensureProfile";

const router: IRouter = Router();

router.use(healthRouter);

router.use(requireAuth, ensureProfileMiddleware);

router.use(profileRouter);
router.use(tenantsRouter);
router.use(hubsRouter);
router.use(logsRouter);
router.use(metricsRouter);
router.use(habitsRouter);
router.use(projectsRouter);
router.use(calendarRouter);
router.use(systemStateRouter);
router.use(notificationsRouter);
router.use(automationRouter);
router.use(insightsRouter);
router.use(adminRouter);

export default router;
