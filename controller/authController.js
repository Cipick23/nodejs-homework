// AuthController.js
import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import passport from "passport";
import { STATUS_CODES } from "../utils/constants.js";
import gravatar from "gravatar";
import { v4 as uuidv4 } from "uuid";
import sendEmailTo from "../utils/sendmail.js";

const AuthController = {
  login,
  signup,
  validateAuth,
  getPayloadFromJWT,
  getUserByValidationToken,
  updateToken,
};

const secretForToken = process.env.TOKEN_SECRET;

async function login(data) {
  const { email, password } = data;

  const user = await User.findOne({ email: email, verify: true });
  if (!user) {
    throw new Error(
      "The username does not exist or the email was not yet validated."
    );
  }

  const isMatching = await bcrypt.compare(password, user.password);
  if (isMatching) {
    const token = jwt.sign({ data: user }, secretForToken, { expiresIn: "1h" });
    await User.findOneAndUpdate({ email: email }, { token: token });
    return token;
  } else {
    throw new Error("Email is not matching");
  }
}

async function signup(data) {
  const saltRounds = 10;
  const encryptedPassword = await bcrypt.hash(data.password, saltRounds);
  const userAvatar = gravatar.url(data.email);
  const token = uuidv4();
  const newUser = new User({
    email: data.email,
    password: encryptedPassword,
    subscription: "starter",
    token: null,
    avatarURL: userAvatar,
    verificationToken: token,
    verify: false,
  });

  sendEmailTo(data.email, token);

  return User.create(newUser);
}

async function updateToken(email, token) {
  token = token || uuidv4();
  await User.findOneAndUpdate({ email }, { verificationToken: token });
  sendEmailTo(email, token);
}

function getPayloadFromJWT(token) {
  try {
    const payload = jwt.verify(token, secretForToken);

    return payload;
  } catch (err) {
    console.error(err);
  }
}

export function validateAuth(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (!user || err) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        data: "Unauthorized",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
}

export async function getUserByValidationToken(token) {
  const user = await User.findOne({ verificationToken: token, verify: false });

  if (user) {
    return true;
  }
  return false;
}

export default AuthController;
