import { Router, type IRouter } from "express";
import authRouter from "./auth";
import healthRouter from "./health";
import siteContentRouter from "./site-content";
import imagesRouter from "./images";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(siteContentRouter);
router.use(imagesRouter);
router.use(contactRouter);

export default router;
