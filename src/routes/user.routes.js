import { Router } from "express";
import {userLogin, userRegister, userLogout, refreshAccessToken} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJwt} from "../middlewares/auth.middleware.js";

const router = new Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount : 1
        }
    ]),
    userRegister
)

router.route("/login").post(userLogin)
router.route("/refresh-access-token").post(refreshAccessToken)

// secured routes
router.route("/logout").post(verifyJwt, userLogout)

export default router