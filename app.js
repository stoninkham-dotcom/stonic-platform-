
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = id => document.getElementById(id);

  const PROJECT_KEY = "stonic_projects_v7";
  const API_KEY = "stonic_gemini_key";
  const MODEL = "gemini-2.5-flash";

  let html = "";
  let project = null;
  let history = [];
  let mode = "desktop";
  let busy = false;

  const fieldIds = [
    "projectName",
    "businessType",
    "businessLocation",
    "websitePrompt",
    "brandColor",
    "designStyle"
  ];

  const fields = Object.fromEntries(
    fieldIds.map(id => [id, $(id)])
  );

  const setText = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };

  const getApiKey = () => localStorage.getItem(API_KEY) || "";

  const getSections = () =>
    [...document.querySelectorAll('[name="sections"]:checked')]
      .map(item => item.value);

  const getData = () => ({
    name: fields.projectName.value.trim(),
    type: fields.businessType.value,
    location: fields.businessLocation.value.trim(),
    prompt: fields.websitePrompt.value.trim(),
    color: fields.brandColor.value,
    style: fields.designStyle.value,
    sections: getSections()
  });

  const slug = value =>
    (value || "website")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "website";

  function getProjects() {
    try {
      const data = JSON.parse(localStorage.getItem(PROJECT_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function updateConnection(message) {
    setText("apiStatus", message);
    setText(
      "connectionStatus",
      getApiKey() ? "Gemini AI Connected" : "AI Not Connected"
    );
  }

  // GEMINI CONNECTION

  async function geminiRequest(key, prompt, systemInstruction) {
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 16000
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini request failed.");
    }

    const candidate = data.candidates?.[0];

    if (candidate?.finishReason === "MAX_TOKENS") {
      throw new Error("Gemini response was cut off. Try a shorter request.");
    }

    const result = (candidate?.content?.parts || [])
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!result) {
      throw new Error("Gemini returned an empty response.");
    }

    return result
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  async function connectGemini() {
    if (busy) return;

    const key = $("geminiApiKey").value.trim();

    if (!key) {
      alert("Enter your Gemini API key first.");
      return;
    }

    $("connectGemini").disabled = true;
    updateConnection("Testing Gemini connection...");

    try {
      await geminiRequest(
        key,
        "Reply exactly: STONIC CONNECTED",
        "You are a connection test. Reply with the requested text only."
      );

      localStorage.setItem(API_KEY, key);
      $("geminiApiKey").value = "";

      updateConnection("Gemini connected. Key saved on this device.");
    } catch (error) {
      updateConnection("Connection failed: " + error.message);
      alert(error.message);
    } finally {
      $("connectGemini").disabled = false;
    }
  }

  function disconnectGemini() {
    if (!confirm("Disconnect Gemini on this device?")) return;

    localStorage.removeItem(API_KEY);
    $("geminiApiKey").value = "";
    updateConnection("Gemini disconnected.");
  }

  async function askGemini(prompt) {
    const key = getApiKey();

    if (!key) {
      throw new Error("Connect Gemini first in AI Settings.");
    }

    return geminiRequest(
      key,
      prompt,
      [
        "You are STONIC, a professional AI website developer.",
        "Return only one complete standalone HTML document.",
        "Include all CSS and JavaScript inside that HTML document.",
        "Do not use external templates or prebuilt template systems.",
        "Build the website from the user's actual requirements.",
        "Make it responsive for mobile, tablet and desktop.",
        "Use semantic HTML, accessible controls and clean design.",
        "Do not invent real contact details, claims or testimonials.",
        "Use clearly labelled placeholders for missing business information.",
        "When editing, preserve all unrelated existing sections and functionality.",
        "Do not remove previous approved changes unless explicitly requested."
      ].join(" ")
    );
  }

  // WEBSITE VALIDATION

  function validateHTML(value) {
    if (
      typeof value !== "string" ||
      !/<html[\s>]/i.test(value) ||
      !/<\/html>/i.test(value) ||
      !/<body[\s>]/i.test(value) ||
      !/<\/body>/i.test(value) ||
      value.length > 500000
    ) {
      throw new Error(
        "Generated website is incomplete or invalid. Previous version was preserved."
      );
    }

    return value;
  }

  // PROJECT STORAGE

  function saveProject(silent = false) {
    if (!project || !html) return false;

    project.html = html;
    project.history = history;
    project.updated = new Date().toISOString();

    const projects = getProjects();
    const index = projects.findIndex(item => item.id === project.id);

    if (index < 0) {
      projects.unshift(project);
    } else {
      projects[index] = project;
    }

    try {
      localStorage.setItem(
        PROJECT_KEY,
        JSON.stringify(projects.slice(0, 30))
      );
    } catch {
      setText("status", "Device storage is full. Export your website.");
      return false;
    }

    renderProjects();

    if (!silent) {
      setText("status", "Project saved on this device.");
    }

    return true;
  }

  function renderProjects() {
    const box = $("projectList");
    box.replaceChildren();

    const projects = getProjects();

    if (!projects.length) {
      box.textContent = "No saved projects yet.";
      return;
    }

    projects.forEach(item => {
      const card = document.createElement("div");
      card.className = "project-card";

      const title = document.createElement("b");
      title.textContent = item.name || "Untitled website";

      const open = document.createElement("button");
      open.type = "button";
      open.textContent = "Open";
      open.onclick = () => loadProject(item);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.className = "soft";

      remove.onclick = () => {
        if (!confirm("Delete this saved project?")) return;

        const remaining = getProjects().filter(
          saved => saved.id !== item.id
        );

        localStorage.setItem(PROJECT_KEY, JSON.stringify(remaining));

        if (project?.id === item.id) {
          project = null;
          html = "";
          history = [];
          render();
          renderHistory();
        }

        renderProjects();
      };

      card.append(title, open, remove);
      box.append(card);
    });
  }

  function loadProject(item) {
    project = { ...item };
    html = item.html || "";
    history = Array.isArray(item.history) ? item.history : [];

    const mapping = {
      projectName: "name",
      businessType: "type",
      businessLocation: "location",
      websitePrompt: "prompt",
      brandColor: "color",
      designStyle: "style"
    };

    fieldIds.forEach(id => {
      const value = item[mapping[id]];
      if (fields[id] && value != null) {
        fields[id].value = value;
      }
    });

    document.querySelectorAll('[name="sections"]').forEach(box => {
      box.checked = (item.sections || []).includes(box.value);
    });

    render();
    renderHistory();

    setText("status", "Project loaded successfully.");
    setText("editStatus", "You can now edit this website.");
  }

  // PREVIEW

  function render() {
    const box = $("canvasState");
    box.replaceChildren();

    if (!html) {
      const heading = document.createElement("h2");
      heading.textContent = "Your website starts here";

      const description = document.createElement("p");
      description.textContent = "Generate your first website with STONIC AI.";

      box.append(heading, description);

      setText("previewStatus", "NOT GENERATED");
      $("previewWebsite").disabled = true;
      $("applyPromptChanges").disabled = true;
      $("downloadPublish").disabled = true;
      $("publishWebsite").disabled = true;
      return;
    }

    const frame = document.createElement("iframe");
    frame.title = "STONIC website preview";
    frame.setAttribute("sandbox", "allow-scripts allow-forms");
    frame.style.width = mode === "mobile" ? "375px" : "100%";
    frame.style.maxWidth = "100%";
    frame.style.minHeight = "620px";
    frame.srcdoc = html;

    box.append(frame);

    setText("previewStatus", "PREVIEW READY");
    $("previewWebsite").disabled = false;
    $("applyPromptChanges").disabled = false;
    $("downloadPublish").disabled = false;

    // Publishing remains disabled until the publishing backend is added.
    $("publishWebsite").disabled = true;
  }

  function openPreview() {
    if (!html) return;

    const win = window.open("", "_blank");

    if (!win) {
      alert("Allow pop-ups to open the preview in a new tab.");
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  // VERSION HISTORY

  function renderHistory() {
    const box = $("historyList");
    box.replaceChildren();

    history.forEach((version, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "soft";

      const date = version.at
        ? new Date(version.at).toLocaleString()
        : "Previous version";

      button.textContent = `Restore version ${index + 1} · ${date}`;

      button.onclick = () => {
        if (!confirm("Restore this previous version?")) return;

        const current = html;

        html = version.html;

        history.splice(index, 1);
        history.unshift({
          html: current,
          at: new Date().toISOString()
        });

        render();
        saveProject();
        renderHistory();

        setText("editStatus", "Previous version restored.");
      };

      box.append(button);
    });
  }

  function commitWebsite(nextHTML, message) {
    nextHTML = validateHTML(nextHTML);

    const previousHTML = html;

    if (previousHTML) {
      history.unshift({
        html: previousHTML,
        at: new Date().toISOString()
      });
    }

    html = nextHTML;

    if (!project) {
      project = {
        ...getData(),
        id: "project_" + Date.now()
      };
    }

    project.html = html;
    project.history = history;

    render();
    const saved = saveProject(true);
    renderHistory();

    setText(
      "editStatus",
      saved ? message : message + " Please export a backup; device storage failed."
    );
  }

  // GENERATE COMPLETE WEBSITE

  async function generateWebsite() {
    if (busy) return;

    const data = getData();

    if (!data.name || !data.prompt) {
      alert("Enter the business name and website requirements.");
      return;
    }

    if (!getApiKey()) {
      alert("Connect Gemini first.");
      return;
    }

    busy = true;
    $("generate").disabled = true;
    setText("status", "STONIC AI is creating your website...");

    try {
      const prompt = [
        "Build a complete professional website from scratch. Do not use a template.",
        "Business name: " + data.name,
        "Business category: " + data.type,
        "Location: " + (data.location || "Not supplied"),
        "Design style: " + data.style,
        "Brand colour: " + data.color,
        "Required sections: " + data.sections.join(", "),
        "Client requirements: " + data.prompt,
        "Create a polished layout with navigation, hero section, suitable content,",
        "responsive styling and working page interactions where appropriate.",
        "Do not invent real business contact details or testimonials.",
        "Return a complete standalone HTML document only."
      ].join("\n");

      const result = await askGemini(prompt);

      project = {
        ...data,
        id: "project_" + Date.now()
      };

      history = [];

      commitWebsite(
        result,
        "Website generated. You can now edit it with prompts."
      );

      setText("status", "Website generated successfully.");
    } catch (error) {
      setText("status", "Generation failed: " + error.message);
      alert(error.message);
    } finally {
      busy = false;
      $("generate").disabled = false;
    }
  }

  // EDIT EXISTING WEBSITE WITH PROMPTS

  async function editWebsite() {
    if (busy || !html) return;

    const prompt = $("editPrompt").value.trim();

    if (!prompt) {
      alert("Describe the changes you want.");
      return;
    }

    if (!getApiKey()) {
      alert("Connect Gemini first.");
      return;
    }

    busy = true;
    $("applyPromptChanges").disabled = true;
    setText("editStatus", "STONIC AI is updating your existing website...");

    try {
      const result = await askGemini([
        "Update the existing website according to the new request.",
        "This is an existing client website. Do not rebuild it from scratch.",
        "Apply the requested changes while preserving all previous approved work.",
        "Preserve unrelated sections, layout, content and working features.",
        "Do not remove existing functionality unless explicitly requested.",
        "Return the complete updated standalone HTML document.",
        "",
        "NEW CHANGE REQUEST:",
        prompt,
        "",
        "CURRENT WEBSITE HTML:",
        html
      ].join("\n"));

      commitWebsite(
        result,
        "Changes applied and saved. You can submit another prompt."
      );

      $("editPrompt").value = "";
    } catch (error) {
      setText(
        "editStatus",
        "Edit failed. Previous website is unchanged. " + error.message
      );
    } finally {
      busy = false;
      $("applyPromptChanges").disabled = !html;
    }
  }

  // HTML DOWNLOAD

  function downloadHTML() {
    if (!html) return;

    const url = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = slug(project?.name) + ".html";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ZIP DOWNLOAD

  function crc32(bytes) {
    let crc = -1;

    for (const byte of bytes) {
      crc ^= byte;

      for (let i = 0; i < 8; i++) {
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
      }
    }

    return (crc ^ -1) >>> 0;
  }

  function zipBlob(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    const u16 = n => [n & 255, (n >>> 8) & 255];
    const u32 = n => [...u16(n & 65535), ...u16(n >>> 16)];

    files.forEach(file => {
      const name = encoder.encode(file.name);
      const data = encoder.encode(file.content);
      const crc = crc32(data);

      const local = new Uint8Array([
        0x50, 0x4b, 3, 4,
        20, 0, 0, 0,
        0, 0, 0, 0,
        ...u32(crc),
        ...u32(data.length),
        ...u32(data.length),
        ...u16(name.length),
        0, 0,
        ...name
      ]);

      localParts.push(local, data);

      const central = new Uint8Array([
        0x50, 0x4b, 1, 2,
        20, 0, 20, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        ...u32(crc),
        ...u32(data.length),
        ...u32(data.length),
        ...u16(name.length),
        0, 0,
        0, 0,
        0, 0,
        0, 0, 0, 0,
        ...u32(offset),
        ...name
      ]);

      centralParts.push(central);
      offset += local.length + data.length;
    });

    const centralSize = centralParts.reduce(
      (sum, part) => sum + part.length, 0
    );

    const end = new Uint8Array([
      0x50, 0x4b, 5, 6,
      0, 0, 0, 0,
      ...u16(files.length),
      ...u16(files.length),
      ...u32(centralSize),
      ...u32(offset),
      0, 0
    ]);

    return new Blob(
      [...localParts, ...centralParts, end],
      { type: "application/zip" }
    );
  }

  function downloadZIP() {
    if (!html) return;

    const files = [
      { name: "index.html", content: html },
      {
        name: "README.txt",
        content: "Website generated with STONIC Website Builder."
      }
    ];

    const url = URL.createObjectURL(zipBlob(files));
    const link = document.createElement("a");

    link.href = url;
    link.download = slug(project?.name) + "-website.zip";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 2000);

    setText(
      "publishStatus",
      "ZIP downloaded. This website has not been publicly published."
    );
  }

  // NEW PROJECT

  function newProject() {
    if (!confirm("Start a new project? Saved projects will remain.")) {
      return;
    }

    html = "";
    project = null;
    history = [];

    fields.projectName.value = "";
    fields.businessType.selectedIndex = 0;
    fields.businessLocation.value = "";
    fields.websitePrompt.value = "";
    fields.brandColor.value = "#3978ff";
    fields.designStyle.selectedIndex = 0;

    document.querySelectorAll('[name="sections"]')
      .forEach(box => box.checked = true);

    $("editPrompt").value = "";

    render();
    renderHistory();

    setText("status", "New project ready.");
    setText("editStatus", "Generate or load a website first.");
  }

  // EVENTS

  $("connectGemini").addEventListener("click", connectGemini);
  $("disconnectGemini").addEventListener("click", disconnectGemini);
  $("generate").addEventListener("click", generateWebsite);
  $("applyPromptChanges").addEventListener("click", editWebsite);
  $("saveProject").addEventListener("click", () => saveProject());
  $("exportProject").addEventListener("click", downloadHTML);
  $("downloadPublish").addEventListener("click", downloadZIP);
  $("previewWebsite").addEventListener("click", openPreview);
  $("newProject").addEventListener("click", newProject);

  $("desktopView").addEventListener("click", () => {
    mode = "desktop";
    render();
  });

  $("mobileView").addEventListener("click", () => {
    mode = "mobile";
    render();
  });

  // INITIALIZE

  renderProjects();
  render();
  renderHistory();

  $("geminiApiKey").value = "";

  updateConnection(
    getApiKey()
      ? "Gemini key is already saved on this device."
      : "Connect Gemini to start building."
  );

  setText(
    "publishStatus",
    "Public publishing backend is not connected yet."
  );
});
    
