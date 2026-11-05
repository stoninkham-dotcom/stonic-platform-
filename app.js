
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const projectName = $("projectName");
  const businessType = $("businessType");
  const brandColor = $("brandColor");
  const websitePrompt = $("websitePrompt");
  const generateBtn = $("generate");
  const status = $("status");
  const canvasState = $("canvasState");
  const canvasTitle = $("canvasTitle");
  const canvasDescription = $("canvasDescription");
  const previewBtn = $("previewWebsite");
  const saveBtn = $("saveProject");
  const exportBtn = $("exportProject");
  const projectList = $("projectList");
  const newProjectBtn = $("newProject");

  let generatedHTML = "";
  let currentProject = null;
  let progressTimer = null;

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function createWebsite(name, type, color, prompt) {
    const safeName = escapeHTML(name || "My Business");
    const safeType = escapeHTML(type || "Business");
    const safePrompt = escapeHTML(prompt || "Welcome to our website.");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeName}</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;color:#172033;line-height:1.6}
header{padding:22px 7%;display:flex;justify-content:space-between;align-items:center;background:white;position:sticky;top:0}
header strong{font-size:24px;color:${color}}
nav a{margin-left:18px;text-decoration:none;color:#172033}
.hero{padding:100px 7%;background:#f0f5ff;text-align:center}
.hero h1{font-size:clamp(32px,6vw,58px);margin:0 0 15px}
.hero p{font-size:18px;max-width:650px;margin:15px auto}
.btn{display:inline-block;background:${color};color:white;padding:14px 25px;border-radius:8px;text-decoration:none;margin-top:15px}
section{padding:65px 7%;text-align:center}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:30px}
.card{padding:25px;border:1px solid #e5e7eb;border-radius:14px}
footer{padding:30px;text-align:center;background:#172033;color:white}
</style>
</head>
<body>
<header><strong>${safeName}</strong><nav><a href="#home">Home</a><a href="#services">Services</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>
<main>
<div class="hero" id="home">
<h1>Welcome to ${safeName}</h1>
<p>${safePrompt}</p>
<a class="btn" href="#contact">Get in touch</a>
</div>
<section id="services"><h2>Our Services</h2>
<div class="cards">
<div class="card"><h3>Quality Service</h3><p>Professional solutions for your needs.</p></div>
<div class="card"><h3>Expert Team</h3><p>Friendly and experienced support.</p></div>
<div class="card"><h3>Customer Care</h3><p>We put our customers first.</p></div>
</div></section>
<section id="about"><h2>About Us</h2><p>Welcome to our ${safeType.toLowerCase()} business. We are here to serve you.</p></section>
<section id="contact"><h2>Contact Us</h2><p>Get in touch with our team today.</p><a class="btn" href="mailto:hello@example.com">Contact Us</a></section>
</main>
<footer>© ${new Date().getFullYear()} ${safeName}. All rights reserved.</footer>
</body></html>`;
  }

  function showProgress() {
    canvasState.innerHTML = `
      <div style="padding:45px 20px;text-align:center">
        <div style="font-size:20px;font-weight:700;margin-bottom:18px">Creating your website...</div>
        <div style="height:12px;background:#e5eaf3;border-radius:20px;overflow:hidden">
          <div id="generationProgress" style="height:100%;width:0%;background:#1764ed;border-radius:20px;transition:width .25s"></div>
        </div>
        <p id="progressText" style="color:#687386;margin-top:12px">Preparing your design · 0%</p>
      </div>`;
  }

  function generateWebsite() {
    if (!projectName || !websitePrompt || !canvasState) {
      alert("Some required page elements are missing. Please check index.html.");
      return;
    }

    if (!projectName.value.trim() || !websitePrompt.value.trim()) {
      alert("Please enter a project name and website description.");
      return;
    }

    clearInterval(progressTimer);
    generateBtn.disabled = true;
    generateBtn.textContent = "Creating...";
    if (status) status.textContent = "Building your website concept...";
    if (previewBtn) previewBtn.disabled = true;

    showProgress();

    const name = projectName.value.trim();
    const type = businessType ? businessType.value : "Business";
    const color = brandColor && brandColor.value ? brandColor.value : "#1764ed";
    const prompt = websitePrompt.value.trim();

    let progress = 0;
    progressTimer = setInterval(() => {
      progress = Math.min(progress + 10, 100);

      const bar = $("generationProgress");
      const label = $("progressText");
      if (bar) bar.style.width = progress + "%";
      if (label) label.textContent = "Creating website concept · " + progress + "%";

      if (progress >= 100) {
        clearInterval(progressTimer);

        generatedHTML = createWebsite(name, type, color, prompt);
        currentProject = {
          name,
          type,
          color,
          prompt,
          html: generatedHTML,
          updated: new Date().toLocaleString()
        };

        canvasState.innerHTML = `
          <div style="padding:45px 20px;text-align:center">
            <div style="font-size:42px;color:#16834a">✓</div>
            <h2 style="margin:12px 0">Website concept created!</h2>
            <p style="color:#687386">Your website is ready to preview.</p>
          </div>`;

        if (canvasTitle) canvasTitle.textContent = name;
        if (canvasDescription) canvasDescription.textContent = "Website concept generated successfully.";
        if (previewBtn) previewBtn.disabled = false;
        generateBtn.disabled = false;
        generateBtn.textContent = "Create website concept →";
        if (status) status.textContent = "Website created successfully!";
      }
    }, 120);
  }

  function previewWebsite() {
    if (!generatedHTML) {
      alert("Create your website first.");
      return;
    }

    const blob = new Blob([generatedHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function saveProject() {
    if (!currentProject) {
      alert("Create a website before saving.");
      return;
    }

    try {
      const projects = JSON.parse(localStorage.getItem("stonicProjects") || "[]");
      projects.unshift(currentProject);
      localStorage.setItem("stonicProjects", JSON.stringify(projects.slice(0, 30)));
      renderProjects();
      if (status) status.textContent = "Project saved on this device.";
      alert("Project saved successfully!");
    } catch (error) {
      alert("Could not save project. Browser storage may be full.");
    }
  }

  function renderProjects() {
    if (!projectList) return;

    const projects = JSON.parse(localStorage.getItem("stonicProjects") || "[]");
    projectList.innerHTML = projects.length
      ? projects.map((p, i) =>
        `<div style="padding:12px;border-bottom:1px solid #eee">
          <strong>${escapeHTML(p.name)}</strong>
          <div style="color:#687386;font-size:13px">${escapeHTML(p.updated || "")}</div>
          <button type="button" data-project="${i}">Load project</button>
        </div>`
      ).join("")
      : "Your saved projects will appear here.";

    projectList.querySelectorAll("[data-project]").forEach(button => {
      button.addEventListener("click", () => {
        const p = projects[Number(button.dataset.project)];
        if (!p) return;
        projectName.value = p.name;
        if (businessType) businessType.value = p.type;
        if (brandColor) brandColor.value = p.color;
        websitePrompt.value = p.prompt;
        generatedHTML = p.html;
        currentProject = p;
        canvasState.innerHTML = "<div style='padding:40px;text-align:center'><h2>Saved website loaded</h2><p>Your saved concept is ready.</p></div>";
        if (previewBtn) previewBtn.disabled = false;
        if (status) status.textContent = "Saved project loaded.";
      });
    });
  }

  function exportHTML() {
    if (!generatedHTML) {
      alert("Create your website first.");
      return;
    }

    const blob = new Blob([generatedHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (projectName.value.trim() || "stonic-website") + ".html";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (generateBtn) generateBtn.addEventListener("click", generateWebsite);
  if (previewBtn) previewBtn.addEventListener("click", previewWebsite);
  if (saveBtn) saveBtn.addEventListener("click", saveProject);
  if (exportBtn) exportBtn.addEventListener("click", exportHTML);

  if (newProjectBtn) {
    newProjectBtn.addEventListener("click", () => {
      if (projectName) projectName.value = "";
      if (websitePrompt) websitePrompt.value = "";
      generatedHTML = "";
      currentProject = null;
      if (previewBtn) previewBtn.disabled = true;
      if (canvasState) canvasState.innerHTML = "<div style='padding:45px;text-align:center'><h2>Your website starts here</h2><p>Add your business details and create a website concept.</p></div>";
      if (status) status.textContent = "Ready for a new project.";
    });
  }

  renderProjects();
});
      
