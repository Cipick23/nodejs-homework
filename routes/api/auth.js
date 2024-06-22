// auth.js
import express from "express";
import AuthController from "../../controller/authController.js";
import { STATUS_CODES } from "../../utils/constants.js";
import User from "../../models/user.js";
import FileController from "../../controller/fileController.js";

const router = express.Router();

// POST localhost:3000/users/login
router.post("/login", async (req, res, next) => {
  try {
    const isValid = checkLoginPayload(req.body);
    if (!isValid) {
      throw new Error("The login request is invalid.");
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(STATUS_CODES.unauthorized).json({
        status: "error",
        code: 401,
        message: "Email or password is not correct",
        data: "Conflict",
      });
    }

    const token = await AuthController.login({ email, password });

    res.status(STATUS_CODES.success).json({
      message: "Utilizatorul a fost logat cu succes",
      token: token,
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (error) {
    respondWithError(res, error, STATUS_CODES.error);
  }
});

// POST localhost:3000/api/users/signup
router.post("/signup", async (req, res, next) => {
  try {
    const isValid = checkSignupPayload(req.body);

    if (!isValid) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Incorrect login or password",
        data: "Bad request",
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({
        status: "error",
        code: 409,
        message: "Email is already in use",
        data: "Conflict",
      });
    }

    await AuthController.signup({ email, password });

    res.status(201).json({ message: "Utilizatorul a fost creat" });
  } catch (error) {
    respondWithError(res, error, STATUS_CODES.error);
  }
});

// GET localhost:3000/api/users/logout
router.get("/logout", AuthController.validateAuth, async (req, res) => {
  try {
    const header = req.get("authorization");
    if (!header) {
      throw new Error("E nevoie de autentificare pentru aceasta ruta.");
    }

    const token = header.split(" ")[1];
    const payload = AuthController.getPayloadFromJWT(token);

    await User.findOneAndUpdate({ email: payload.data.email }, { token: null });

    res.status(204).send();
  } catch (error) {
    respondWithError(res, error, STATUS_CODES.error);
  }
});

// GET localhost:3000/api/users/current
router.get("/current", AuthController.validateAuth, async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      email: user.email,
      subscription: user.subscription,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PATCH localhost:3000/api/users/avatars
router.patch(
  "/avatars",
  [AuthController.validateAuth, FileController.uploadFile],
  async (req, res) => {
    try {
      console.log("Req user:", req.user); // Log user info
      const response = await FileController.processAvatar(req, res);
      res.status(STATUS_CODES.success).json(response);
    } catch (error) {
      console.log("Error in patch route:", error);
      respondWithError(res, error, STATUS_CODES.error);
    }
  }
);

// GET /api/users/verify/:verificationToken
router.get("/verify/:verificationToken", async (req, res) => {
  const token = req.params.verificationToken;
  const hasUser = await AuthController.getUserByValidationToken(token);

  if (hasUser) {
    try {
      await User.findOneAndUpdate(
        { verificationToken: token },
        { verify: true }
      );
    } catch (error) {
      throw new Error(
        "The username could not be found or it was already validated."
      );
    }

    res.status(200).send({
      message: "Verification successful",
    });
  } else {
    respondWithError(res, new Error("User not found"), STATUS_CODES.error);
  }
});

// POST /users/auth/verify
router.post("/verify", async (req, res) => {
  try {
    const isValid = req.body?.email;
    const email = req.body?.email;

    if (isValid) {
      AuthController.updateToken(email);
      res.status(200).json({
        message: "Verification email sent",
      });
    } else {
      throw new Error("The email field is required");
    }
  } catch (error) {
    respondWithError(res, error, STATUS_CODES.error);
  }
});

// validate login payload
function checkLoginPayload(data) {
  if (!data?.email || !data?.password) {
    return false;
  }
  return true;
}

// validate signup payload
function checkSignupPayload(data) {
  if (!data?.email || !data?.password) {
    return false;
  }
  if (data?.password.length < 8) {
    return false;
  }
  return true;
}

// error response
function respondWithError(res, error, statusCode) {
  console.error("Error handler:", error);
  res.status(statusCode).json({ message: `${error}` });
}

export default router;
