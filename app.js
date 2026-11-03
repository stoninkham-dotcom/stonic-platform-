
const STORAGE_KEY = "stonic_projects_v1";

let projects = [];
let activeProjectId = null;

const $ = (id) => document.getElementById(id);

function loadProjects() {
  try {
    projects = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    projects = [];
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function getFormData() {
  return {
    name: $("name").value.trim() || "Untitled Website",
    type: $("type").value.trim(),
    prompt: $("prompt").value.trim()
  };
}

function showPreview() {
  const data = getFormData();

  $("brand").textContent = data.name.toUpperCase();
  $("title").textContent =
    data.prompt.split(/[.!?\n]/)[0] || "Your website starts here.";

  $("copy").textContent =
    data.prompt || "Describe your website to see a preview.";

  $("status").textContent =
    "Preview updated. This is a website concept, not a published website.";
}

function saveProject() {
  const data = getFormData();

  if (!data.prompt) {
    $("status").textContent = "Please enter your website instructions first.";
    return;
  }

  let project = projects.find(
    (item) => item.id === activeProjectId
  );

  if (!project) {
    project = {
      id: Date.now().toString(),
      history: [],
      created: new Date().toISOString()
    };

    projects.unshift(project);
    activeProjectId = project.id;
  }

  project.name = data.name;
  project.type = data.type;
  project.prompt = data.prompt;
  project.updated = new Date().toISOString();

  project.history.unshift({
    prompt: data.prompt,
    date: new Date().toISOString()
  });

  saveProjects();

  $("saved").textContent =
    "Saved successfully · " + project.history.length + " version(s)";

  $("status").textContent = "Project and edit history saved.";
  renderProjects();
}

function escapeText(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return map[char];
  });
}

function renderProjects() {
  const list = $("list");

  if (!projects.length) {
    list.textContent = "No projects saved yet.";
    return;
  }

  list.innerHTML = projects.map((project) => `
    <article class="panel" style="margin:12px 0">
      <h3>${escapeText(project.name)}</h3>
      <p class="muted">
        ${escapeText(project.type)} ·
        ${project.history.length} saved version(s)
      </p>
      <button data-open="${project.id}">Open</button>
      <button data-delete="${project.id}">Delete</button>
    </article>
  `).join("");

  list.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const project = projects.find(
        (item) => item.id === button.dataset.open
      );

      if (!project) return;

      activeProjectId = project.id;
      $("name").value = project.name;
      $("type").value = project.type;
      $("prompt").value = project.prompt;

      showTab("builder");
      showPreview();
    });
  });

  list.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const confirmed = confirm("Delete this project and its history?");

      if (!confirmed) return;

      projects = projects.filter(
        (item) => item.id !== button.dataset.delete
      );

      if (activeProjectId === button.dataset.delete) {
        activeProjectId = null;
      }

      saveProjects();
      renderProjects();
    });
  });
}

function showTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.add("hide");
  });

  const selectedTab = $(tabName);

  if (selectedTab) {
    selectedTab.classList.remove("hide");
  }

  document.querySelectorAll(".nav").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.tab === tabName
    );
  });

  const headings = {
    builder: "Website Builder",
    projects: "Projects & History",
    chatbot: "Chatbot Builder"
  };

  $("heading").textContent = headings[tabName] || "STONIC";
  
  if (tabName === "projects") {
    renderProjects();
  }
}

function createNewProject() {
  activeProjectId = null;

  $("name").value = "";
  $("type").value = "";
  $("prompt").value = "";
  $("saved").textContent = "New unsaved project";
  $("status").textContent = "Enter your website instructions.";

  showTab("builder");
}

function exportWebsite() {
  const data = getFormData();

  const safeName = escapeText(data.name);
  const safePrompt = escapeText(data.prompt);
  const firstLine = escapeText(
    data.prompt.split(/[.!?\n]/)[0] || data.name
  );

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeName}</title>
<style>
body{font-family:Arial,sans-serif;margin:0;color:#172033}
header{padding:25px 8%;color:#245bdb;font-weight:bold}
main{padding:90px 8%;background:#edf3ff;text-align:center}
h1{font-size:36px}
p{line-height:1.7}
</style>
</head>
<body>
<header>${safeName}</header>
<main>
<h1>${firstLine}</h1>
<p>${safePrompt}</p>
</main>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "stonic-website-preview.html";
  link.click();

  URL.revokeObjectURL(url);
}

function initializeApp() {
  loadProjects();

  document.querySelectorAll(".nav").forEach((button) => {
    button.addEventListener("click", () => {
      showTab(button.dataset.tab);
    });
  });

  $("preview").addEventListener("click", showPreview);
  $("save").addEventListener("click", saveProject);
  $("new").addEventListener("click", createNewProject);
  $("export").addEventListener("click", exportWebsite);

  renderProjects();
}

document.addEventListener("DOMContentLoaded", initializeApp);
    
