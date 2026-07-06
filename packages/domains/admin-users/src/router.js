import { Router } from "express";
import { AppError } from "@travel-suite/utils";
import {
  createAdminUserSchema,
  updateAdminUserSchema,
  adminSetPasswordSchema,
} from "./validators.js";

function validate(schemaFn) {
  return (req, res, next) => {
    try {
      req.body = schemaFn(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function createAdminUsersRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  // Any authenticated admin (any role) can manage their own profile
  router.get("/me", protect, controller.getMe);
  router.patch("/me", protect, controller.updateMe);
  router.patch("/me/password", protect, controller.updateMyPassword);

  // router.use(protect, restrictTo("admin"));

  router
    .route("/")
    .get(controller.getAdminUsers)
    .post(validate(createAdminUserSchema), controller.createAdminUser);

  router
    .route("/:username")
    .get(controller.getAdminUser)
    .patch(validate(updateAdminUserSchema), controller.updateAdminUser)
    .delete(controller.deleteAdminUser);

  // Admin-only: reset any user's password (does not require the target's current password)
  router.patch(
    "/:username/password",
    protect,
    restrictTo("admin"),
    validate(adminSetPasswordSchema),
    controller.adminSetUserPassword,
  );

  return router;
}
