import { defineConfig } from "vite";
import { resolve } from "node:path";
import { cpSync, readdirSync } from "node:fs";

// Wellora is a vanilla-JS multi-page application. Listing every HTML page
// ensures production builds retain the existing page-to-page navigation.
const pages = [
  "index.html",
  "splash.html",
  "signup.html",
  "login.html",
  "forgot-password.html",
  "reset-password-sent.html",
  "onboarding.html",
  "home.html",
  "category.html",
  "exercise.html",
  "completion.html",
  "progress.html",
  "profile.html",
  "reminders.html",
  "reports.html",
  "ai-chat.html",
  "privacy.html",
  "terms.html",
  "disclaimer.html",
  "emergency.html"
];

const staticRootFiles = ["manifest.json"];

function copyClassicApplicationAssets() {
  return {
    name: "copy-classic-application-assets",
    closeBundle() {
      const outputDirectory = resolve(__dirname, "dist");

      // The app intentionally uses classic browser scripts that share globals
      // (rather than ES modules). Vite leaves those script tags untouched, so
      // copy their source files alongside the generated HTML pages.
      for (const file of readdirSync(__dirname)) {
        if (file.endsWith(".js") && file !== "vite.config.js") {
          cpSync(resolve(__dirname, file), resolve(outputDirectory, file));
        }
      }

      for (const file of staticRootFiles) {
        cpSync(resolve(__dirname, file), resolve(outputDirectory, file));
      }

      // Some exercise and category images are selected dynamically in the
      // existing scripts, so they must remain available at /image/.
      cpSync(resolve(__dirname, "image"), resolve(outputDirectory, "image"), {
        recursive: true
      });
    }
  };
}

export default defineConfig({
  plugins: [copyClassicApplicationAssets()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [page.replace(".html", ""), resolve(__dirname, page)])
      )
    }
  }
});
