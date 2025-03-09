#!/usr/bin/env node

const fs = require("fs");
const axios = require("axios");
const { execSync } = require("child_process");
const { program } = require("commander");

// ---- הגדרות ----
const RENDER_SERVICE_ID = "srv-XXXXXX"; // מזהה השירות שלך ב-Render
const RENDER_API_KEY = "your-render-api-key";

const NETLIFY_AUTH_TOKEN = "your-netlify-auth-token";
const NETLIFY_SITE_ID = "your-netlify-site-id";
const FRONTEND_BUILD_DIR = "dist"; // שם התיקייה של הפרונט (למשל dist או build)

// ---- בדיקה אם קיים Dockerfile ----
const hasDockerfile = fs.existsSync("Dockerfile");

// ---- פונקציה לפריסת צד השרת עם Docker ב-Render ----
async function deployToRenderWithDocker() {
  console.log("🚀 מפריס את צד השרת (Docker) ל-Render...");
  try {
    await axios.post(
      `https://api.render.com/deploy/${RENDER_SERVICE_ID}`,
      {},
      { headers: { Authorization: `Bearer ${RENDER_API_KEY}` } }
    );
    console.log("✅ צד השרת (Docker) נשלח לפריסה ב-Render");
  } catch (error) {
    console.error("❌ שגיאה בפריסת צד השרת:", error.response?.data || error);
  }
}

// ---- פונקציה לפריסת צד השרת ללא Docker ב-Render ----
async function deployToRenderWithoutDocker() {
  console.log("🚀 מפריס את צד השרת ל-Render (ללא Docker)...");
  try {
    await axios.post(
      `https://api.render.com/deploy/${RENDER_SERVICE_ID}`,
      {},
      { headers: { Authorization: `Bearer ${RENDER_API_KEY}` } }
    );
    console.log("✅ צד השרת נשלח לפריסה ב-Render");
  } catch (error) {
    console.error("❌ שגיאה בפריסת צד השרת:", error.response?.data || error);
  }
}

// ---- פונקציה לפריסת צד הלקוח ל-Netlify ----
function deployToNetlify() {
  console.log("🚀 מפריס את צד הלקוח ל-Netlify...");
  try {
    execSync(`npm install -g netlify-cli`, { stdio: "inherit" });
    execSync(
      `netlify deploy --prod --dir=${FRONTEND_BUILD_DIR} --auth ${NETLIFY_AUTH_TOKEN} --site ${NETLIFY_SITE_ID}`,
      { stdio: "inherit" }
    );
    console.log("✅ צד הלקוח נשלח לפריסה ב-Netlify");
  } catch (error) {
    console.error("❌ שגיאה בפריסת צד הלקוח:", error);
  }
}

// ---- הגדרת פרמטרים עבור CLI ----
program
  .option("--only-server", "פריסת צד שרת בלבד")
  .option("--only-client", "פריסת צד לקוח בלבד")
  .parse(process.argv);

const options = program.opts();

// ---- הפעלת הפריסה בהתאם לבדיקה ----
(async () => {
  if (!options.onlyClient) {
    if (hasDockerfile) {
      await deployToRenderWithDocker();
    } else {
      await deployToRenderWithoutDocker();
    }
  }

  if (!options.onlyServer) {
    deployToNetlify();
  }
})();
