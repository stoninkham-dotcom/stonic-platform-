
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

  const STORAGE_KEY = "stonic_website_projects_v3";

  let currentHTML = "";
  let currentProject = null;
  let generationTimer = null;
  let previewMode = "desktop";
  let previewWindow = null;

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
    if ($("connectionDot")) {
      $("connectionDot").style.color = online ? "#20c997" : "#ffae42";
    }
    if ($("connectionStatus")) {
      $("connectionStatus").textContent = online ? "Online" : "Offline";
    }
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

  function sectionHTML(section, name, type) {
    const content = {
      Services: `
        <section class="section" id="services">
          <div class="container">
            <span class="tag">WHAT WE DO</span>
            <h2>Our Services</h2>
            <div class="cards">
              <article class="card"><h3>Professional Service</h3><p>Quality solutions designed around your needs.</p></article>
              <article class="card"><h3>Expert Support</h3><p>Friendly guidance from an experienced team.</p></article>
              <article class="card"><h3>Trusted Results</h3><p>Careful attention to quality and detail.</p></article>
            </div>
          </div>
        </section>`,

      About: `
        <section class="section soft" id="about">
          <div class="container split">
            <div><span class="tag">ABOUT US</span><h2>Built around your needs.</h2><p>${escapeHTML(name)} is focused on delivering a thoughtful and professional experience.</p></div>
            <img src="${makeImage(type)}" alt="${escapeHTML(type)}" loading="lazy">
          </div>
        </section>`,

      Team: `
        <section class="section" id="team">
          <div class="container"><span class="tag">OUR PEOPLE</span><h2>Meet Our Team</h2>
            <div class="cards">
              <article class="card"><h3>Alex Morgan</h3><p>Senior Specialist</p></article>
              <article class="card"><h3>Jamie Lee</h3><p>Client Experience</p></article>
              <article class="card"><h3>Sam Taylor</h3><p>Operations</p></article>
            </div>
          </div>
        </section>`,

      Gallery: `
        <section class="section soft" id="gallery">
          <div class="container"><span class="tag">OUR GALLERY</span><h2>A closer look</h2>
            <div class="gallery">
              <img src="${makeImage(type)}" alt="Gallery image" loading="lazy">
              <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80" alt="Workspace" loading="lazy">
            </div>
          </div>
        </section>`,

      Reviews: `
        <section class="section" id="reviews">
          <div class="container"><span class="tag">CLIENT STORIES</span><h2>What people say</h2>
            <div class="cards">
              <article class="card"><div class="stars">★★★★★</div><p>"A professional and welcoming experience."</p></article>
              <article class="card"><div class="stars">★★★★★</div><p>"Great attention to detail."</p></article>
              <article class="card"><div class="stars">★★★★★</div><p>"Helpful team and smooth service."</p></article>
            </div>
          </div>
        </section>`,

      FAQ: `
        <section class="section soft" id="faq">
          <div class="container"><span class="tag">QUESTIONS</span><h2>Frequently Asked Questions</h2>
            <details><summary>How can I contact your team?</summary><p>Use the contact section below.</p></details>
            <details><summary>Where are you located?</summary><p>${escapeHTML(fields.location.value || "Contact us for location details.")}</p></details>
          </div>
        </section>`,

      Contact: `
        <section class="section contact-section" id="contact">
          <div class="container"><span class="tag">GET IN TOUCH</span><h2>Let's talk about your needs.</h2>
            <p>Contact ${escapeHTML(name)} to learn more.</p>
            <form id="demoContactForm">
              <input type="text" placeholder="Your name" required>
              <input type="email" placeholder="Your email" required>
              <textarea placeholder="Your message" required></textarea>
              <button type="submit">Send message</button>
            </form>
            <p class="form-note">Demo form: connect a secure form service before accepting real messages.</p>
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

    const dark = data.style === "Luxury";

    const sections = data.sections.map(section =>
      sectionHTML(section, data.name, data.type)
    ).join("");

    const nav = [
      ["Services", "services"],
      ["About", "about"],
      ["Team", "team"],
      ["Gallery", "gallery"],
      ["Reviews", "reviews"],
      ["FAQ", "faq"],
      ["Contact", "contact"]
    ].filter(item => data.sections.includes(item[0]));

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
.split{display:grid;grid-template-columns:1fr 1fr;gap:45px;align-items:center}
.split img{width:100%;height:340px;object-fit:cover;border-radius:18px}
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
${nav.map(item => `<a href="#${item[1]}">${item[0]}</a>`).join("")}
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
<img src="${makeImage(data.type)}" alt="${type}">
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

  function getProjects() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveProject(silent = false) {
    if (!currentProject) return;

    try {
      const projects = getProjects();
      const index = projects.findIndex(p => p.name === currentProject.name);

      if (index >= 0) projects[index] = currentProject;
      else projects.unshift(currentProject);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, 30)));
      renderProjects();

      if ($("saveStatus")) {
        $("saveStatus").textContent = "Project saved on this device";
      }
      if (!silent) $("status").textContent = "Project saved successfully.";
    } catch {
      if (!silent) alert("Storage is full. Export your website as a backup.");
    }
  }

  function updateOpenedPreview() {
    if (!previewWindow || previewWindow.closed) return false;

    try {
      previewWindow.document.open();
      previewWindow.document.write(currentHTML);
      previewWindow.document.close();
      return true;
    } catch {
      previewWindow = null;
      return false;
    }
  }

  function openPreviewTab() {
    if (!currentHTML) return;

    if (previewWindow && !previewWindow.closed) {
      updateOpenedPreview();
      previewWindow.focus();
      return;
    }

    previewWindow = window.open("", "STONIC_WEBSITE_PREVIEW");

    if (!previewWindow) {
      alert("Please allow pop-ups for this website, then tap Open Preview again.");
      return;
    }

    updateOpenedPreview();
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

    // Canvas title and description are outside the iframe.
    const title = $("canvasTitle");
    const description = $("canvasDescription");
    if (title) title.textContent = currentProject.name;
    if (description) description.textContent = "Your website concept is ready.";

    buttons.preview.disabled = false;
    buttons.publish.disabled = false;
  }

  function updateProject(data) {
    currentHTML = createWebsite(data);

    currentProject = {
      ...data,
      html: currentHTML,
      updated: new Date().toISOString()
    };

    renderPreview();
    updateOpenedPreview();
    saveProject(true);
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

      $("progressText").textContent =
        messages[Math.min(3, Math.floor(progress / 30))];

      if (progress === 100) {
        clearInterval(generationTimer);
        updateProject(data);
        buttons.generate.disabled = false;
        $("status").textContent = "Website concept created successfully!";
        $("previewStatus").textContent = "READY";
      }
    }, 120);
  }

  // Edit with Prompt: basic built-in commands, no AI connection yet.
  function editWithPrompt() {
    if (!currentProject) {
      alert("Create or load a website first.");
      return;
    }

    const box = $("editPrompt");
    const instruction = box.value.trim().toLowerCase();

    if (!instruction) {
      alert("Please describe what you want to change.");
      return;
    }

    const updated = {
      ...currentProject,
      sections: [...currentProject.sections]
    };

    let changed = false;

    const colorNames = {
      blue: "#3978ff",
      red: "#e53935",
      green: "#198754",
      purple: "#7952b3",
      orange: "#f08c00",
      black: "#171717",
      pink: "#e64980",
      teal: "#0f9d9a"
    };

    for (const [word, color] of Object.entries(colorNames)) {
      if (instruction.includes("color") && instruction.includes(word)) {
        updated.color = color;
        fields.color.value = color;
        changed = true;
        break;
      }
    }

    if (instruction.includes("dark") || instruction.includes("luxury")) {
      updated.style = "Luxury";
      fields.style.value = "Luxury";
      changed = true;
    }

    if (instruction.includes("light") || instruction.includes("bright")) {
      updated.style = "Modern Premium";
      fields.style.value = "Modern Premium";
      changed = true;
    }

    const addSection = [
      ["services", "Services"],
      ["about", "About"],
      ["team", "Team"],
      ["gallery", "Gallery"],
      ["reviews", "Reviews"],
      ["faq", "FAQ"],
      ["contact", "Contact"]
    ];

    for (const [word, section] of addSection) {
      if (
        (instruction.includes("add") || instruction.includes("show") ||
         instruction.includes("include")) &&
        instruction.includes(word) &&
        !updated.sections.includes(section)
      ) {
        updated.sections.push(section);
        changed = true;
      }

      if (
        (instruction.includes("remove") || instruction.includes("hide")) &&
        instruction.includes(word)
      ) {
        updated.sections = updated.sections.filter(s => s !== section);
        changed = true;
      }
    }

    if (instruction.includes("change name to")) {
      const newName = box.value.split(/change name to/i)[1]?.trim();
      if (newName) {
        updated.name = newName;
        fields.name.value = newName;
        changed = true;
      }
    }

    if (changed) {
      document.querySelectorAll('input[name="sections"]').forEach(input => {
        input.checked = updated.sections.includes(input.value);
      });

      updateProject(updated);
      $("editStatus").textContent =
        "Website updated. Preview refreshed and project saved.";
      $("status").textContent = "Your requested changes have been applied.";
      box.value = "";
    } else {
      $("editStatus").textContent =
        "This basic editor supports color changes, dark/light style, adding/removing sections and changing the name. Full AI prompt editing needs an AI connection.";
    }
  }

  function addEditPanel() {
    const previewButtons = document.querySelector(".preview-buttons");
    if (!previewButtons || $("editPromptPanel")) return;

    const panel = document.createElement("div");
    panel.id = "editPromptPanel";
    panel.style.cssText =
      "margin-top:18px;padding:18px;border:1px solid #64748b44;border-radius:12px;background:#111827;";

    const heading = document.createElement("h3");
    heading.textContent = "✦ Edit with Prompt";
    heading.style.color = "#fff";

    const help = document.createElement("p");
    help.textContent =
      "Try: Change color to blue · Make it dark · Add gallery · Remove team";
    help.style.color = "#aab5c7";
    help.style.fontSize = "13px";

    const textarea = document.createElement("textarea");
    textarea.id = "editPrompt";
    textarea.placeholder = "Describe the change you want...";
    textarea.rows = 3;
    textarea.style.cssText =
      "width:100%;padding:12px;border-radius:8px;box-sizing:border-box;";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Apply Changes";
    button.style.marginTop = "10px";
    button.addEventListener("click", editWithPrompt);

    const status = document.createElement("p");
    status.id = "editStatus";
    status.style.color = "#aab5c7";
    status.setAttribute("aria-live", "polite");

    
