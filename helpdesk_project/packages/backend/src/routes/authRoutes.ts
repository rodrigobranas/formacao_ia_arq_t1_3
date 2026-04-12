import { Router, type NextFunction, type Request, type Response } from "express";
import {
  DuplicateEmailError,
  InvalidCredentialsError,
  PasswordLengthError,
  signin,
  signup,
  ValidationError,
} from "../services/authService";

export const authRoutes = Router();

function sendErrorResponse(error: unknown, res: Response) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }

  if (
    error instanceof DuplicateEmailError ||
    error instanceof PasswordLengthError
  ) {
    return res.status(422).json({ error: error.message });
  }

  if (error instanceof InvalidCredentialsError) {
    return res.status(401).json({ error: error.message });
  }

  throw error;
}

authRoutes.post("/signup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await signup(req.body);
    res.status(200).json(result);
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});

authRoutes.post("/signin", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await signin(req.body);
    res.status(200).json(result);
  } catch (error) {
    try {
      sendErrorResponse(error, res);
    } catch (unhandledError) {
      next(unhandledError);
    }
  }
});
