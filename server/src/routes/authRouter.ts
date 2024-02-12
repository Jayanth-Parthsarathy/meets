import { Router } from "express";
import {
  isLoggedIn,
  login,
  logout,
  refreshAccessToken,
  register,
} from "../controllers/authController";

const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/check-auth", isLoggedIn);
authRouter.post("/refresh", refreshAccessToken);

export default authRouter;
