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

const staticRootFiles = ["manifest.json", "layout.css"];

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

function netlifyFunctionsPlugin() {
  const handleFunction = async (req, res, next) => {
    const url = req.url?.split("?")[0];
    if (url === "/.netlify/functions/ask-gemini" || url === "/api/ask-gemini") {
      try {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks).toString("utf-8");
        const askGemini = await import("./netlify/functions/ask-gemini.js");
        const handler = askGemini.handler || askGemini.default?.handler;
        const result = await handler({
          httpMethod: req.method,
          headers: req.headers,
          body
        });
        res.statusCode = result.statusCode || 200;
        if (result.headers) {
          for (const [k, v] of Object.entries(result.headers)) {
            res.setHeader(k, v);
          }
        }
        res.end(result.body || "");
        return;
      } catch (err) {
        console.error("Error in ask-gemini handler:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    if (url === "/.netlify/functions/ai-summarize" || url === "/api/ai-summarize") {
      try {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks).toString("utf-8");
        const aiSummarize = await import("./netlify/functions/ai-summarize.js");
        const handler = aiSummarize.handler || aiSummarize.default?.handler;
        const result = await handler({
          httpMethod: req.method,
          headers: req.headers,
          body
        });
        res.statusCode = result.statusCode || 200;
        if (result.headers) {
          for (const [k, v] of Object.entries(result.headers)) {
            res.setHeader(k, v);
          }
        }
        res.end(result.body || "");
        return;
      } catch (err) {
        console.error("Error in ai-summarize handler:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    }

    next();
  };

  return {
    name: "netlify-functions-plugin",
    configureServer(server) {
      server.middlewares.use(handleFunction);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleFunction);
    }
  };
}

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true
  },
  plugins: [copyClassicApplicationAssets(), netlifyFunctionsPlugin()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [page.replace(".html", ""), resolve(__dirname, page)])
      )
    }
  }
});
