import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dbiRouter from "./dbi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dbiRouter);

export default router;
