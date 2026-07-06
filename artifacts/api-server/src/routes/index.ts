import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import hubsRouter from "./hubs";
import logsRouter from "./logs";
import metricsRouter from "./metrics";
import habitsRouter from "./habits";
import calendarRouter from "./calendar";
import notificationsRouter from "./notifications";
import automationRouter from "./automation";
import adminRouter from "./admin";
import { requireAuth } from "../middlewares/requireAuth";
import { ensureProfileMiddleware } from "../middlewares/ensureProfile";

const router: IRouter = Router();

router.use(healthRouter);

router.use(requireAuth, ensureProfileMiddleware);

router.use(profileRouter);
router.use(hubsRouter);
router.use(logsRouter);
router.use(metricsRouter);
router.use(habitsRouter);
router.use(calendarRouter);
router.use(notificationsRouter);
router.use(automationRouter);
router.use(adminRouter);

export default router;
