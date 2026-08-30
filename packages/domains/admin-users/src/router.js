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

  // Public byline data for the blog. Must stay above the protect guard below.
  router.get("/authors", controller.getPublicAuthors);
  router.get("/authors/:slug", controller.getPublicAuthor);

  router.get("/me", protect, controller.getMe);
  router.patch("/me", protect, controller.updateMe);
  router.patch("/me/password", protect, controller.updateMyPassword);

  // Must precede the CRUD routes: without it createAdminUser is a public privilege-escalation endpoint.
  router.use(protect, restrictTo("admin"));

  router
    .route("/")
    .get(controller.getAdminUsers)
    .post(validate(createAdminUserSchema), controller.createAdminUser);

  router
    .route("/:username")
    .get(controller.getAdminUser)
    .patch(validate(updateAdminUserSchema), controller.updateAdminUser)
    .delete(controller.deleteAdminUser);

  router.patch(
    "/:username/password",
    protect,
    restrictTo("admin"),
    validate(adminSetPasswordSchema),
    controller.adminSetUserPassword,
  );

  return router;
}
