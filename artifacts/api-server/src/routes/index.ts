import { Router, type IRouter } from "express";
import healthRouter from "./health";
import freelanceRouter from "./freelance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(freelanceRouter);

export default router;
