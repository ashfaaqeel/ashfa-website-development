import { Router, type IRouter } from "express";
import authRouter from "./auth.js";
import healthRouter from "./health.js";
import siteContentRouter from "./site-content.js";
import imagesRouter from "./images.js";
import contactRouter from "./contact.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(siteContentRouter);
router.use(imagesRouter);
router.use(contactRouter);

export default router;
