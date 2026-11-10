import { Router, type IRouter } from "express";
import authRouter from "./auth";
import healthRouter from "./health";
import siteContentRouter from "./site-content";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(siteContentRouter);

export default router;
