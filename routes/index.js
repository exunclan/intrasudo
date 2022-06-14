const router = require("express").Router();
const auth = require("./auth");
const levels = require("./levels");
const play = require("./play");
const leaderboard = require("./leaderboard");
const users = require("./users");
const models = require("../models");
const { authenticated, admin } = require("../lib/auth");

router.get("/", (req, res) =>
  res.render("index", {
    title: req.isAuthenticated() ? "Instructions" : "Sign in",
  })
);

router.use("/auth", auth);
router.use("/levels", levels);
router.use("/play", play);
router.use("/leaderboard", leaderboard);
router.use("/users", users);

router.get("/notifications", async (_req, res) => {
  res.render("notifications", {
    notifications: await models.Notifications.findAll({
      order: [["createdAt", "DESC"]],
    }),
  });
});

router.get(
  "/admin/notifications",
  authenticated(),
  admin(),
  async (req, res) => {
    res.render("admin-notifications", {
      notifications: await models.Notifications.findAll(),
    });
  }
);

router.post(
  "/admin/notifications/new",
  authenticated(),
  admin(),
  async (req, res) => {
    try {
      await models.Notifications.create(req.body);
      res.render("admin-notifications", {
        notifications: await models.Notifications.findAll(),
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
