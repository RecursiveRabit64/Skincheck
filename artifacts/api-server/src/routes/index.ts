import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diagnoseRouter from "./diagnose";
import chatRouter from "./chat";
import authRouter from "./auth";
import profilesRouter from "./profiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(diagnoseRouter);
router.use(chatRouter);

export default router;
