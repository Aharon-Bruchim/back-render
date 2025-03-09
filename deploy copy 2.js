import axios from "axios";

// API קי של Render
const RENDER_API_KEY = "rnd_VEuBVnZC2gdm5hFaOWQ1FccVTMXd";
// שם השירות שתרצה ליצור
const SERVICE_NAME = "my-nodejs-app";

if (!RENDER_API_KEY) {
  console.error("❌ חסר RENDER_API_KEY");
  process.exit(1);
}

// יצירת מופע axios עם הרשאות API
const renderApi = axios.create({
  baseURL: "https://api.render.com/v1",
  headers: { Authorization: `Bearer ${RENDER_API_KEY}` }
});

// בדוק אם שירות כבר קיים
async function findService() {
  try {
    console.log(`🔍 מחפש שירות בשם: ${SERVICE_NAME}`);
    const response = await renderApi.get("/services");
    const services = response.data;
    const service = services.find(s => s.name === SERVICE_NAME);
    
    if (service) {
      console.log(`✅ נמצא שירות קיים: ${service.id}`);
    } else {
      console.log(`ℹ️ לא נמצא שירות בשם ${SERVICE_NAME}`);
    }
    
    return service;
  } catch (error) {
    console.error(`❌ שגיאה בבדיקת שירותים: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// יצירת שירות חדש
async function createService() {
  console.log(`🔧 יוצר שירות Render חדש: ${SERVICE_NAME}`);
  
  try {
    // מבנה בסיסי לשירות static site (הכי פשוט)
    // שנה את הפרמטרים לפי הצורך
    const response = await renderApi.post("/services", {
      name: SERVICE_NAME,
      type: "static_site", // או web_service, background_worker לפי סוג הפרויקט
      env: "node",
      region: "fra", // Frankfurt (EU)
      buildCommand: "npm install && npm run build", // שנה לפי הצורך
      publishPath: "build", // או dist או public לפי הפרויקט שלך
      plan: "free"
    });
    
    console.log(`✅ שירות נוצר בהצלחה: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ שגיאה ביצירת שירות: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.error("פרטי שגיאה:", JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// הפעל פריסה לשירות קיים
async function deployToService(serviceId) {
  console.log(`🚀 מפעיל פריסה לשירות: ${serviceId}`);
  
  try {
    const response = await renderApi.post(`/services/${serviceId}/deploys`, {});
    console.log(`✅ פריסה הופעלה בהצלחה: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ שגיאה בהפעלת פריסה: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.error("פרטי שגיאה:", JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// הצגת סטטוס כל השירותים
async function listAllServices() {
  try {
    console.log("📋 רשימת כל השירותים:");
    const response = await renderApi.get("/services");
    const services = response.data;
    
    if (services.length === 0) {
      console.log("אין שירותים קיימים");
    } else {
      services.forEach(service => {
        console.log(`- ${service.name} (${service.id}): ${service.type}, סטטוס: ${service.serviceDetails?.status || 'לא ידוע'}`);
      });
    }
  } catch (error) {
    console.error(`❌ שגיאה בקבלת רשימת שירותים: ${error.response?.data?.message || error.message}`);
  }
}

// פונקציה ראשית
async function main() {
  // הצג את כל השירותים הקיימים
  await listAllServices();
  
  // בדוק אם השירות כבר קיים
  const existingService = await findService();
  
  if (existingService) {
    // אם השירות קיים, הפעל פריסה
    await deployToService(existingService.id);
  } else {
    // אם השירות לא קיים, צור חדש
    const newService = await createService();
    if (newService) {
      console.log(`🔗 קישור לשירות החדש: ${newService.serviceDetails.url}`);
    }
  }
}

// הפעל את הסקריפט
main().catch(error => {
  console.error(`❌ שגיאה לא מטופלת: ${error.message}`);
});