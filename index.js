// index.js
const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const flash = require("connect-flash");
const dotenv = require("dotenv");
dotenv.config();

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: ... , // Redis, Memcached, etc. See below.
});

const { attachUserToLocals } = require("./routes/_middleware");

// Route modules
const homeRoutes = require("./routes/home");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const workoutsRoutes = require("./routes/workouts");
const metricsRoutes = require("./routes/metrics");
const searchRoutes = require("./routes/search");
const adminRoutes = require("./routes/admin");
const weatherRoutes = require("./routes/weather");

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Body parser
app.use(express.urlencoded({ extended: true }));

// Session store (MySQL)
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "health_app",
  password: process.env.DB_PASSWORD || "qwertyuiop",
  database: process.env.DB_NAME || "health_app",
});

app.use(
  session({
    key: "health_app_sid",
    secret: process.env.SESSION_SECRET || "change_this_for_real_project",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  })
);

app.use(flash());

// Make user + flash messages available in all views
app.use(attachUserToLocals);

// Routes
app.use("/", homeRoutes);
app.use("/auth", limiter, authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/workouts", workoutsRoutes);
app.use("/metrics", metricsRoutes);
app.use("/search", searchRoutes);
app.use("/admin", adminRoutes);
app.use("/weather", weatherRoutes);

// 404
app.use((req, res) => {
  res.status(404);
  res.render("error_404");
});

// 500
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500);
  res.render("error_500");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Health app listening on http://localhost:${PORT}`);
});
