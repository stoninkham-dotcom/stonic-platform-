
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const fields = {
    name: $("projectName"),
    type: $("businessType"),
    location: $("businessLocation"),
    prompt: $("websitePrompt"),
    color: $("brandColor"),
    style: $("designStyle"),
    template: $("templateChoice")
  };

  const buttons = {
    generate: $("generate"),
    preview: $("previewWebsite"),
    save: $("saveProject"),
    export: $("exportProject"),
    publish: $("publishWebsite"),
    new: $("newProject"),
    desktop: $("desktopView"),
    mobile: $("mobileView")
  };

  let currentHTML = "";
  let currentProject = null;
  let generationTimer = null;
  let previewMode = "desktop";

  const STORAGE_KEY = "stonic_website_projects_v3";

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getSections() {
    return [...document.querySelectorAll(
      'input[name="sections"]:checked'
    )].map(item => item.value);
  }

  function updateConnection() {
    const online = navigator.onLine;
    const dot = $("connectionDot");
    const label = $("connectionStatus");

    if (dot) dot.style.color = online ? "#20c997" : "#ffae42";
    if (label) label.textContent = online ? "Online" : "Offline";

    if ($("saveStatus")) {
      $("saveStatus").textContent = online
        ? "Local saving available"
        : "Offline · Local saving available";
    }
  }

  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateConnection();

  function makeImage(type) {
    const images = {
      "Dental Clinic": "photo-1629909613654-28e377c37b09",
      "Restaurant": "photo-1517248135467-4c7edcad34c4",
      "Real Estate": "photo-1600607687939-ce8a6c25118c",
      "E-commerce": "photo-1441986300917-64674bd600d8",
      "Agency": "photo-1497366754035-f200968a6e72",
      "Hotel": "photo-1566073771259-6a8506099945",
      "Education": "photo-1509062522246-3755977927d7",
      "Portfolio": "photo-1497366811353-6870744d04b2"
    };

    const id = images[type] || "photo-1497366754035-f200968a6e72";
    return "https://images.unsplash.com/" + id +
      "?auto=format&fit=crop&w=1400&q=85";
  }

  function sectionHTML(section, name, type, color) {
    const content = {
      Services: `
        <section class="section">
          <div class="container">
            <span class="tag">WHAT WE DO</span>
            <h2>Our Services</h2>
            <div class="cards">
              <article class="card"><div class="card-icon">✦</div><h3>Professional Service</h3><p>Quality solutions designed around your needs.</p></article>
              <article class="card"><div class="card-icon">◇</div><h3>Expert Support</h3><p>Friendly guidance from an experienced team.</p></article>
              <article class="card"><div class="card-icon">✓</div><h3>Trusted Results</h3><p>Careful attention to quality and detail.</p></article>
            </div>
          </div>
        </section>`,
      About: `
        <section class="section soft">
          <div class="container split">
            <div><span class="tag">ABOUT US</span><h2>Built around your needs.</h2><p>${escapeHTML(name)} is focused on delivering a thoughtful and professional experience. We combine quality, care and attention to detail.</p></div>
            <img src="${makeImage(type)}" alt="${escapeHTML(type)}" loading="lazy">
          </div>
        </section>`,
      Team: `
        <section class="section">
          <div class="container"><span class="tag">OUR PEOPLE</span><h2>Meet Our Team</h2>
            <div class="cards">
              <article class="card"><div class="avatar">A</div><h3>Alex Morgan</h3><p>Senior Specialist</p></article>
              <article class="card"><div class="avatar">J</div><h3>Jamie Lee</h3><p>Client Experience</p></article>
              <article class="card"><div class="avatar">S</div><h3>Sam Taylor</h3><p>Operations</p></article>
            </div>
          </div>
        </section>`,
      Gallery: `
        <section class="section soft">
          <div class="container"><span class="tag">OUR GALLERY</span><h2>A closer look</h2>
            <div class="gallery">
              <img src="${makeImage(type)}" alt="Gallery image" loading="lazy">
              <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80" alt="Workspace" loading="lazy">
            </div>
          </div>
        </section>`,
      Reviews: `
        <section class="section">
          <div class="container"><span class="tag">CLIENT STORIES</span><h2>What people say</h2>
            <div class="cards">
              <article class="card"><div class="stars">★★★★★</div><p>"A very professional and welcoming experience."</p><strong>Customer Review</strong></article>
              <article class="card"><div class="stars">★★★★★</div><p>"Great attention to detail and excellent service."</p><strong>Customer Review</strong></article>
              <article class="card"><div class="stars">★★★★★</div><p>"Helpful team and a smooth experience."</p><strong>Customer Review</strong></article>
            </div>
          </div>
        </section>`,
      FAQ: `
        <section class="section soft">
          <div class="container"><span class="tag">QUESTIONS</span><h2>Frequently Asked Questions</h2>
            <details><summary>How can I contact your team?</summary><p>Use the contact section below to reach us.</p></details>
            <details><summary>Where are you located?</summary><p>${escapeHTML(fields.location.value || "Contact us for location details.")}</p></details>
            <details><summary>How can I learn more?</summary><p>Send us a message and our team will help.</p></details>
          </div>
        </section>`,
      Contact: `
        <section class="section contact-section">
          <div class="container"><span class="tag">GET IN TOUCH</span><h2>Let's talk about your needs.</h2>
            <p>Contact ${escapeHTML(name)} to learn more about our services.</p>
            <form id="demoContactForm">
              <input type="text" placeholder="Your name" required>
              <input type="email" placeholder="Your email" required>
              <textarea placeholder="Your message" required></textarea>
              <button type="submit">Send message</button>
            </form>
            <p class="form-note">Demo form: connect a secure form service before accepting real customer messages.</p>
          </div>
        </section>`
    };

    return content[section] || "";
  }

  function createWebsite(data) {
    const name = escapeHTML(data.name);
    const type = escapeHTML(data.type);
    const location = escapeHTML(data.location || "");
    const prompt = escapeHTML(data.prompt);
    const color = /^#[0-9a-f]{6}$/i.test(data.color)
      ? data.color : "#3978ff";

    const sections = data.sections.map(s =>
      sectionHTML(s, data.name, data.type, color)
    ).join("");

    const style = data.style;
    const dark = style === "Luxury";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${prompt.slice(0,150)}">
<title>${name} | Official Website</title>
<style>
:root{--brand:${color};--ink:${dark ? "#f8f6f0" : "#182238"};--bg:${dark ? "#171717" : "#ffffff"};--soft:${dark ? "#242424" : "#f3f6fb"}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--ink);background:var(--bg);line-height:1.7}
img{max-width:100%;display:block}
.container{width:min(1120px,90%);margin:auto}
header{padding:19px 5%;display:flex;align-items:center;justify-content:space-between;gap:20px;background:var(--bg);position:sticky;top:0;z-index:5;border-bottom:1px solid #8882}
.logo{font-size:22px;font-weight:800;color:var(--brand)}
nav{display:flex;gap:18px;flex-wrap:wrap}
nav a{color:var(--ink);text-decoration:none;font-size:13px;font-weight:600}
.hero{min-height:540px;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:35px;padding:65px 5%;background:var(--soft)}
.hero h1{font-size:clamp(38px,5vw,65px);line-height:1.08;letter-spacing:-2px;margin:14px 0}
.hero p{font-size:17px;max-width:560px;color:${dark ? "#d0d0d0" : "#627087"}}
.hero img{width:100%;height:390px;object-fit:cover;border-radius:20px}
.tag{color:var(--brand);font-size:11px;font-weight:800;letter-spacing:2px}
.btn,button{display:inline-block;border:0;border-radius:8px;background:var(--brand);color:white;padding:14px 22px;text-decoration:none;font-weight:700;cursor:pointer}
.section{padding:85px 0}
.section h2{font-size:clamp(30px,4vw,43px);line-height:1.2;margin:12px 0 25px}
.soft{background:var(--soft)}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:30px}
.card{padding:27px;border:1px solid #8883;border-radius:14px;background:var(--bg)}
.card h3{font-size:18px}
.card p,.split p{color:${dark ? "#d0d0d0" : "#68758b"}}
.card-icon{font-size:28px;color:var(--brand)}
.split{display:grid;grid-template-columns:1fr 1fr;gap:45px;align-items:center}
.split img{width:100%;height:340px;object-fit:cover;border-radius:18px}
.avatar{width:65px;height:65px;border-radius:50%;display:grid;place-items:center;background:var(--soft);color:var(--brand);font-size:25px;font-weight:bold}
.gallery{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.gallery img{height:270px;width:100%;object-fit:cover;border-radius:14px}
.stars{color:#e6a82e;letter-spacing:3px}
details{padding:17px;border-bottom:1px solid #8885}
summary{font-weight:bold;cursor:pointer}
.contact-section{background:var(--soft)}
form{max-width:560px;display:grid;gap:12px;margin-top:25px}
form input,form textarea{width:100%;padding:14px;border:1px solid #ccd3df;border-radius:8px;font:inherit;background:white;color:#182238}
form textarea{min-height:110px}
.form-note{font-size:11px;color:#78859a}
footer{padding:30px 5%;background:#111b2c;color:white;text-align:center}
@media(max-width:720px){
header{align-items:flex-start;flex-direction:column}
nav{gap:12px}
.hero,.split{grid-template-columns:1fr}
.hero{padding-top:45px}
.hero img{height:260px}
.cards{grid-template-columns:1fr}
.gallery{grid-template-columns:1fr}
.section{padding:60px 0}
}
</style>
</head>
<body>
<header>
<div class="logo">${name}</div>
<nav>
<a href="#home">Home</a>
<a href="#services">Services</a>
<a href="#about">About</a>
<a href="#contact">Contact</a>
</nav>
</header>
<main>
<section class="hero" id="home">
<div>
<span class="tag">${type.toUpperCase()} · ${location.toUpperCase()}</span>
<h1>${name}</h1>
<p>${prompt}</p>
<a class="btn" href="#contact">Get in touch ↗</a>
</div>
<img src="${makeImage(data.type)}" alt="${type}" loading="eager">
</section>
${sections}
</main>
<footer>© ${new Date().getFullYear()} ${name}. All rights reserved.</footer>
<script>
document.getElementById("demoContactForm")?.addEventListener("submit",function(e){
e.preventDefault();
alert("This is a demo form. Connect a secure form service to receive messages.");
});
<\/script>
</body>
</html>`;
  }

  function getData() {
    if (!fields.name.value.trim() || !fields.prompt.value.trim()) {
      alert("Please enter a business name and website description.");
      return null;
    }

    return {
      name: fields.name.value.trim(),
      type: fields.type.value,
      location: fields.location.value.trim(),
      prompt: fields.prompt.value.trim(),
      color: fields.color.value,
      style: fields.style.value,
      template: fields.template.value,
      sections: getSections()
    };
  }

  function renderPreview() {
    const frame = $("canvasState");
    if (!frame || !currentHTML) return;

    frame.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.title = "Website preview";
    iframe.setAttribute("sandbox", "allow-scripts allow-forms");
    iframe.style.width = previewMode === "mobile" ? "375px" : "100%";
    iframe.style.maxWidth = "100%";
    iframe.style.height = "650px";
    iframe.style.border = "0";
    iframe.srcdoc = currentHTML;
    frame.style.display = "flex";
    frame.style.justifyContent = "center";
    frame.appendChild(iframe);

    $("previewStatus").textContent = "PREVIEW READY";
    $("canvasTitle").textContent = currentProject.name;
    $("canvasDescription").textContent = "Your website concept is ready.";
    buttons.preview.disabled = false;
    buttons.publish.disabled = false;
  }

  function generateWebsite() {
    const data = getData();
    if (!data) return;

    clearInterval(generationTimer);
    buttons.generate.disabled = true;
    buttons.preview.disabled = true;
    buttons.publish.disabled = true;

    $("generationArea").hidden = false;
    $("status").textContent = "Preparing your website concept...";
    $("previewStatus").textContent = "GENERATING";

    let progress = 0;
    $("generationProgress").style.width = "0%";
    $("progressPercent").textContent = "0%";

    generationTimer = setInterval(() => {
      progress = Math.min(progress + 10, 100);
      $("generationProgress").style.width = progress + "%";
      $("progressPercent").textContent = progress + "%";

      const messages = [
        "Preparing layout...",
        "Creating your design...",
        "Building website sections...",
        "Finishing your preview..."
      ];
      $("progressText").textContent = messages[
        Math.min(3, Math.floor(progress / 30))
      ];

      if (progress === 100) {
        clearInterval(generationTimer);

        currentHTML = createWebsite(data);
        currentProject = {
          ...data,
          html: currentHTML,
          updated: new Date().toISOString()
        };

        renderPreview();
        buttons.generate.disabled = false;
        $("status").textContent = "Website concept created successfully!";
        $("previewStatus").textContent = "READY";
      }
    }, 120);
  }

  function previewInNewTab() {
    if (!currentHTML) return;
    const blob = new Blob([currentHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function getProjects() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveProject() {
    if (!currentProject) {
      alert("Create a website first.");
      return;
    }

    try {
      const projects = getProjects();
      const existing = projects.findIndex(p => p.name === currentProject.name);

      if (existing >= 0) projects[existing] = currentProject;
      else projects.unshift(currentProject);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 30)));
      renderProjects();
      $("saveStatus").textContent = "Project saved on this device";
      $("status").textContent = "Project saved successfully.";
    } catch {
      alert("Storage is full. Export your website as a backup.");
    }
  }

  function renderProjects() {
    const list = $("projectList");
    const projects = getProjects();

    if (!projects.length) {
      list.innerHTML = '<div class="empty-projects">No saved projects yet.</div>';
      return;
    }

    list.innerHTML = "";

    projects.forEach((project, index) => {
      const item = document.createElement("div");
      const title = document.createElement("strong");
      const info = document.createElement("p");
      const load = document.createElement("button");

      title.textContent = project.name;
      info.textContent = project.type + " · " +
        new Date(project.updated).toLocaleString();
      load.textContent = "Load project";

      load.addEventListener("click", () => {
        fields.name.value = project.name;
        fields.type.value = project.type;
        fields.location.value = project.location || "";
        fields.prompt.value = project.prompt;
        fields.color.value = project.color;
        fields.style.value = project.style;
        fields.template.value = project.template;

        document.querySelectorAll('input[name="sections"]').forEach(input => {
          input.checked = project.sections.includes(input.value);
        });

        currentProject = project;
        currentHTML = project.html;
        renderPreview();
        $("status").textContent = "Saved project loaded.";
      });

      item.append(title, info, load);
      list.appendChild(item);
    });
  }

  function exportWebsite() {
    if (!currentHTML) {
      alert("Create a website first.");
      return;
    }

    const blob = new Blob([currentHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = (currentProject.name || "stonic-website")
      .replace(/[^a-z0-9-_]/gi, "-") + ".html";

    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function publishWebsite() {
    $("publishStatus").textContent =
      "Publishing backend is not connected yet. Website is ready to export, but no public link has been created.";
    $("publishedLink").hidden = true;
  }

  buttons.generate.addEventListener("click", generateWebsite);
  buttons.preview.addEventListener("click", previewInNewTab);
  buttons.save.addEventListener("click", saveProject);
  buttons.export.addEventListener("click", exportWebsite);
  buttons.publish.addEventListener("click", publishWebsite);

  buttons.desktop.addEventListener("click", () => {
    previewMode = "desktop";
    renderPreview();
  });

  buttons.mobile.addEventListener("click", () => {
    previewMode = "mobile";
    renderPreview();
  });

  buttons.new.addEventListener("click", () => {
    if (!confirm("Start a new project? Save your current project first if needed.")) return;

    Object.values(fields).forEach(field => {
      if (field === fields.color) field.value = "#3978ff";
      else if (field === fields.type) field.selectedIndex = 0;
      else if (field === fields.style) field.selectedIndex = 0;
      else if (field === fields.template) field.selectedIndex = 0;
      else field.value = "";
    });

    currentHTML = "";
    currentProject = null;
    $("canvasState").innerHTML = `
      <div class="empty-preview">
        <div class="empty-icon">✦</div>
        <h2 id="canvasTitle">Your website starts here</h2>
        <p id="canvasDescription">Create your first professional website concept.</p>
      </div>`;

    $("previewStatus").textContent = "NOT GENERATED";
    buttons.preview.disabled = true;
    buttons.publish.disabled = true;
    $("status").textContent = "Ready for a new project.";
  });

  renderProjects();
});
      
