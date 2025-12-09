const request = require("supertest");
const { expect } = require("chai");
const app = require("../index");
const dotenv = require("dotenv");
dotenv.config();

// Basic router / integration tests for the Health App.
// These tests check that routes respond with the right status
// and that protected routes redirect unauthenticated users.

describe("Health App – router tests", function () {
  // Allow a bit more time in case rendering / external calls are slow.
  this.timeout(5000);

  // Home routes: public pages
  describe("Home routes", () => {
    it("GET / should return 200 and render home page", async () => {
      // Simple smoke test for the home page.
      const res = await request(app).get("/");
      expect(res.status).to.equal(200);
      expect(res.text).to.include("Welcome");
    });

    it("GET /about should return 200 and render about page", async () => {
      // About page should also be publicly accessible.
      const res = await request(app).get("/about");
      expect(res.status).to.equal(200);
      expect(res.text).to.include("About");
    });
  });

  // Auth routes: register, login, delete-account
  describe("Auth routes", () => {
    it("GET /auth/register should return 200 and show register form", async () => {
      // Visiting the register page should show the registration form.
      const res = await request(app).get("/auth/register");
      expect(res.status).to.equal(200);
      expect(res.text.toLowerCase()).to.include("register");
    });

    it("GET /auth/login should return 200 and show login form", async () => {
      // Visiting the login page should show the login form.
      const res = await request(app).get("/auth/login");
      expect(res.status).to.equal(200);
      expect(res.text.toLowerCase()).to.include("login");
    });

    it("GET /auth/delete-account should redirect to login when not logged in", async () => {
      // Delete account route is protected: guests should be redirected.
      const res = await request(app).get("/auth/delete-account");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });

    it("POST /auth/login with empty data should return 422 (validation error)", async () => {
      // Submitting an empty login form should trigger validation errors.
      const res = await request(app)
        .post("/auth/login")
        .send({ identifier: "", password: "" })
        .type("form");

      expect(res.status).to.equal(422);
      expect(res.text.toLowerCase()).to.include(
        "please enter your username or email"
      );
    });

    it("POST /auth/register with invalid username should return 422", async () => {
      // Registering with clearly invalid data should fail validation.
      const res = await request(app)
        .post("/auth/register")
        .send({
          username: "a", // too short
          email: "not-an-email", // invalid email format
          password: "short", // too short
          confirm_password: "short",
        })
        .type("form");

      expect(res.status).to.equal(422);
      expect(res.text.toLowerCase()).to.include(
        "username must be between 3 and 20 characters"
      );
    });
  });

  // Dashboard route: requires login
  describe("Dashboard route", () => {
    it("GET /dashboard should redirect to login when not logged in", async () => {
      // Dashboard should only be visible to logged-in users.
      const res = await request(app).get("/dashboard");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });
  });

  // Workout routes: require login
  describe("Workouts routes", () => {
    it("GET /workouts should redirect to login when not logged in", async () => {
      // Workout list is user-specific; guests are redirected.
      const res = await request(app).get("/workouts");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });

    it("GET /workouts/add should redirect to login when not logged in", async () => {
      // Adding a workout should require an authenticated session.
      const res = await request(app).get("/workouts/add");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });

    it("POST /workouts/add should redirect to login when not logged in", async () => {
      // Submitting a workout while logged out should not create data.
      const res = await request(app)
        .post("/workouts/add")
        .send({
          workout_date: "2025-11-20",
          workout_type_id: 1,
          duration_minutes: 30,
          intensity: "medium",
          notes: "Test workout",
        })
        .type("form");

      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });
  });

  // Metrics routes: require login
  describe("Metrics routes", () => {
    it("GET /metrics should redirect to login when not logged in", async () => {
      // Metrics list is also user-specific; guests cannot access it.
      const res = await request(app).get("/metrics");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });

    it("GET /metrics/add should redirect to login when not logged in", async () => {
      // Form for adding a metric should be protected.
      const res = await request(app).get("/metrics/add");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });

    it("POST /metrics/add should redirect to login when not logged in", async () => {
      // Submitting metric data without a session should not work.
      const res = await request(app)
        .post("/metrics/add")
        .send({
          metric_date: "2025-11-20",
          metric_type_id: 1,
          value: 72.5,
          unit: "kg",
        })
        .type("form");

      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });
  });

  // Search routes: require login
  describe("Search routes", () => {
    it("GET /search should redirect to login when not logged in", async () => {
      // Search form is part of the logged-in experience.
      const res = await request(app).get("/search");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });

    it("GET /search/results should redirect to login when not logged in", async () => {
      // Search results should also require authentication.
      const res = await request(app).get("/search/results");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });
  });

  // Weather route: public page using OpenWeather API
  describe("Weather route", () => {
    it("GET /weather with no city should render the weather page (form only)", async () => {
      // Visiting /weather without a query should show an empty form.
      const res = await request(app).get("/weather");
      expect(res.status).to.equal(200);
      expect(res.text.toLowerCase()).to.include("weather");
    });

    it("GET /weather?city=London should respond with 200 and render the page", async () => {
      // With a city query, we still expect 200 OK and a weather view.
      const res = await request(app).get("/weather").query({ city: "London" });
      expect(res.status).to.equal(200);
      expect(res.text.toLowerCase()).to.include("weather");

      // If no API key is configured, we expect a friendly error message.
      if (!process.env.OPENWEATHER_API_KEY) {
        expect(res.text).to.include("OPENWEATHER_API_KEY is missing");
      }
    });
  });

  // Admin routes: require admin role (and login)
  describe("Admin routes", () => {
    it("GET /admin should redirect to login when not logged in", async () => {
      // Admin dashboard is not available to guests.
      const res = await request(app).get("/admin");
      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });

    it("POST /admin/users/1/role should redirect to login when not logged in", async () => {
      // Changing user roles is an admin-only action.
      const res = await request(app)
        .post("/admin/users/1/role")
        .send({ role: "admin" })
        .type("form");

      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });

    it("POST /admin/users/1/toggle-active should redirect to login when not logged in", async () => {
      // Toggling a user's active status should also be protected.
      const res = await request(app)
        .post("/admin/users/1/toggle-active")
        .type("form");

      expect(res.status).to.be.oneOf([302, 303]);
      expect(res.headers.location).to.include("/auth/login");
    });
  });
});
