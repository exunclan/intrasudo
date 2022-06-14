const express = require("express");
const logger = require("morgan");
const session = require("express-session");
const passport = require("passport");
const helmet = require("helmet");
const compression = require("compression");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);
const crypto = require("crypto");
const path = require("path");
const cors = require("cors");
const csurf = require("csurf");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const models = require("./models");

const client = redis.createClient(process.env.REDIS_URL);
const app = express();

// Views and static files
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// app.use(express.static("public"));

// Middleware
app.use(logger("dev"));
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.use(
  session({
    store: new RedisStore({ client }),
    secret: process.env.SECRET || crypto.randomBytes(20).toString("hex"),
    cookie: {
      secure: false,
      httpOnly: true,
    },
  })
);

// Passport
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// Add auth info and csrfToken to template locals
app.use(async (req, res, next) => {
  res.locals.authenticated = req.isAuthenticated() || false;
  res.locals.user = req.user || {};
  res.locals.csrfToken = req.csrfToken();
  res.locals.last_notif_id = 0;
  const notifs = await models.Notifications.findAll({
    limit: 1,
    order: [["createdAt", "DESC"]],
  });
  if (notifs.length > 0) {
    res.locals.last_notif_id = notifs[0].id;
  }
  console.log(res.locals.last_notif_id);
  next();
});

app.use("/", routes);

app.get("*", (_, res) => res.render("404"));

app.use((err, req, res, _) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(err);
  }

  // Set statusCode to 500 if it isn't already there
  err.statusCode = err.statusCode || 500;
  err.message = err.message || err.name || "Internal Server Error";
  err.code = err.code || err.name || "500_INTERNAL_SERVER_ERR";

  res.locals.authenticated = req.isAuthenticated() || false;
  res.locals.user = req.user;
  res.render("error", { code: err.statusCode, message: err.message });
  return;
});

module.exports = app;
