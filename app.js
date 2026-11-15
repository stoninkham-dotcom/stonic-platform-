
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = id => document.getElementById(id);

  const PROJECT_KEY = "stonic_projects_v6";
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
    "designStyle",
    "templateChoice"
  ];

  const fields = Object.fromEntries(
    fieldIds.map(id => [id, $(id)])
  );

  const setText = (id, value) => {
    if ($(id)) $(id).textContent = value;
  };

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
    template: fields.templateChoice.value,
    sections: getSections()
  });

  const slug = value =>
    (value || "website")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  function getProjects() {
    try {
      return JSON.parse(localStorage.getItem(PROJECT_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function getApiKey() {
    return localStorage.getItem(API_KEY) || "";
  }

  function updateConnection(message) {
    setText("apiStatus", message);
    setText(
      "connectionStatus",
      getApiKey() ? "Gemini AI Connected" : "AI Not Connected"
    );
  }

  // GEMINI API

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
          parts: [{ text: systemInstruction || "You are STONIC AI." }]
        },
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 16000
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Gemini request failed."
      );
    }

    const result = (data.candidates?.[0]?.content?.parts || [])
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
        "You are a connection test. Reply with the requested text."
      );

      localStorage.setItem(API_KEY, key);
      $("geminiApiKey").value = "";

      updateConnection("Gemini connected successfully on this device.");
    } catch (error) {
      updateConnection("Connection failed: " + error.message);
      alert(error.message);
    } finally {
      $("connectGemini").disabled = false;
    }
  }

  function disconnectGemini() {
    if (!confirm("Disconnect Gemini AI on this device?")) return;

    localStorage.removeItem(API_KEY);
    $("geminiApiKey").value = "";

    updateConnection("Gemini disconnected.");
  }

  async function askGemini(prompt) {
    const key = getApiKey();

    if (!key) {
      throw new Error("Connect Gemini AI first.");
    }

    return geminiRequest(
      key,
      prompt,
      [
        "You are STONIC, a professional website-building AI.",
        "Return only a complete standalone HTML document.",
        "Use embedded CSS and JavaScript.",
        "Create responsive, accessible professional websites.",
        "Do not invent real contact details, business claims or testimonials.",
        "Preserve existing working features when editing websites."
      ].join(" ")
    );
  }

  // WEBSITE VALIDATION

  function validateHTML(value) {
    if (
      typeof value !== "string" ||
      !/<html[\s>]/i.test(value) ||
      !/<\/html>/i.test(value) ||
      value.length > 500000
    ) {
      throw new Error(
        "The generated HTML is incomplete or invalid. Previous website was preserved."
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

    if (index === -1) {
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
      setText(
        "status",
        "Storage is full. Export your website before continuing."
      );
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
      open.textContent = "Open";
      open.onclick = () => loadProject(item);

      const remove = document.createElement("button");
      remove.textContent = "Delete";
      remove.className = "soft";

      remove.onclick = () => {
        if (!confirm("Delete this saved project?")) return;

        localStorage.setItem(
          PROJECT_KEY,
          JSON.stringify(
            getProjects().filter(project => project.id !== item.id)
          )
        );

        renderProjects();
      };

      card.append(title, open, remove);
      box.append(card);
    });
  }

  function loadProject(item) {
    project = { ...item };
    html = item.html || "";
    history = item.history || [];

    const mapping = {
      projectName: "name",
      businessType: "type",
      businessLocation: "location",
      websitePrompt: "prompt",
      brandColor: "color",
      designStyle: "style",
      templateChoice: "template"
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
  }

  // PREVIEW

  function render() {
    const box = $("canvasState");
    box.replaceChildren();

    if (!html) {
      const heading = document.createElement("h2");
      heading.textContent = "Your website starts here";

      const description = document.createElement("p");
      description.textContent = "Create your first website.";

      box.append(heading, description);

      setText("previewStatus", "NOT GENERATED");

      [
        "previewWebsite",
        "applyPromptChanges",
        "publishWebsite",
        "downloadPublish"
      ].forEach(id => {
        if ($(id)) $(id).disabled = true;
      });

      return;
    }

    const frame = document.createElement("iframe");

    frame.title = "STONIC website preview";
    frame.sandbox = "allow-scripts allow-forms";
    frame.style.width = mode === "mobile" ? "375px" : "100%";
    frame.style.maxWidth = "100%";
    frame.style.minHeight = "620px";
    frame.srcdoc = html;

    box.append(frame);

    setText("previewStatus", "PREVIEW READY");

    [
      "previewWebsite",
      "applyPromptChanges",
      "publishWebsite",
      "downloadPublish"
    ].forEach(id => {
      if ($(id)) $(id).disabled = false;
    });
  }

  // VERSION HISTORY

  function renderHistory() {
    const box = $("historyList");
    box.replaceChildren();

    history.forEach((version, index) => {
      const button = document.createElement("button");

      button.className = "soft";
      button.textContent = "Restore version " + (index + 1);

      button.onclick = () => {
        if (!confirm("Restore this previous version?")) return;

        const current = html;

        html = version.html;

        history.splice(index, 1);
        history.unshift({
          html: current,
          at: new Date().toISOString()
        });

        history = history.slice(0, 8);

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

    if (html) {
      history.unshift({
        html,
        at: new Date().toISOString()
      });
    }

    history = history.slice(0, 8);
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
    saveProject(true);
    renderHistory();

    setText("editStatus", message);
  }

  // GENERATE WEBSITE

  async function generateWebsite() {
    if (busy) return;

    const data = getData();

    if (!data.name || !data.prompt) {
      alert("Enter the business name and website description.");
      return;
    }

    if (!getApiKey()) {
      alert("Connect Gemini AI first.");
      return;
    }

    busy = true;
    $("generate").disabled = true;

    setText("status", "STONIC AI is generating your website...");

    try {
      const prompt = [
        "Create a complete professional responsive business website.",
        "Business name: " + data.name,
        "Business category: " + data.type,
        "Location: " + (data.location || "Not supplied"),
        "Design style: " + data.style,
        "Brand colour: " + data.color,
        "Template: " + data.template,
        "Required sections: " + data.sections.join(", "),
        "Business requirements: " + data.prompt,
        "Use realistic placeholder content where information is missing.",
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
        "Website generated. You can now edit it with AI."
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

  // EDIT EXISTING WEBSITE

  async function editWebsite() {
    if (busy || !html) return;

    const prompt = $("editPrompt").value.trim();

    if (!prompt) {
      alert("Describe the changes you want.");
      return;
    }

    if (!getApiKey()) {
      alert("Connect Gemini AI first.");
      return;
    }

    busy = true;
    $("applyPromptChanges").disabled = true;

    setText("editStatus", "STONIC AI is updating your website...");

    try {
      const result = await askGemini(
        [
          "Edit the existing website below.",
          "Apply only the new requested changes.",
          "Preserve previous approved changes.",
          "Do not remove unrelated sections or working features.",
          "Return the complete updated HTML.",
          "",
          "NEW REQUEST:",
          prompt,
          "",
          "CURRENT WEBSITE:",
          html
        ].join("\n")
      );

      commitWebsite(
        result,
        "Changes saved. You can restore an earlier version."
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

  // ZIP CREATION

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

    const u16 = n => [
      n & 255,
      (n >>> 8) & 255
    ];

    const u32 = n => [
      ...u16(n & 65535),
      ...u16(n >>> 16)
    ];

    files.forEach(file => {
      const name = encoder.encode(file.name);
      const data = encoder.encode(file.content);
      const crc = crc32(data);

      const localHeader = new Uint8Array([
        0x50, 0x4b, 3, 4,
        20, 0, 0, 0,
        0, 0, 0, 0,
        0, 0,
        ...u32(crc),
        ...u32(data.length),
        ...u32(data.length),
        ...u16(name.length),
        0, 0,
        ...name
      ]);

      localParts.push(localHeader, data);

      const centralHeader = new Uint8Array([
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

      centralParts.push(centralHeader);

      offset += localHeader.length + data.length;
    });

    const centralSize = centralParts.reduce(
      (total, part) => total + part.length,
      0
    );

    const endRecord = new Uint8Array([
      0x50, 0x4b, 5, 6,
      0, 0, 0, 0,
      ...u16(files.length),
      ...u16(files.length),
      ...u32(centralSize),
      ...u32(offset),
      0, 0
    ]);

    return new Blob(
      [...localParts, ...centralParts, endRecord],
      { type: "application/zip" }
    );
  }

  function downloadZIP() {
    if (!html) return;

    const clientName = slug(
      $("deliveryClientName").value || project?.name
    );

    const files = [
      {
        name: "index.html",
        content: html
      }
    ];

    if ($("deliveryIncludeReadme").checked) {
      files.push({
        name: "README.txt",
        content:
          "STONIC CLIENT WEBSITE\n\n" +
          "Website files are included in this ZIP.\n" +
          "Upload this folder to a supported static hosting service " +
          "to make the website publicly accessible.\n"
      });
    }

    const url = URL.createObjectURL(zipBlob(files));
    const link = document.createElement("a");

    link.href = url;
    link.download = clientName + "-website.zip";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 2000);

    setText(
      "publishStatus",
      "Website ZIP downloaded. It has not been publicly published."
    );
  }

  function downloadHTML() {
    if (!html) return;

    const url = URL.createObjectURL(
      new Blob([html], { type: "text/html" })
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = slug(project?.name) + ".html";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // CLIENT PUBLISHING
  // Actual public deployment will be connected in the publishing integration step.

  function publishWebsite() {
    setText(
      "publishStatus",
      "Public publishing is not connected yet. No live website has been deployed."
    );
  }

  // BUTTON EVENTS

  $("connectGemini").addEventListener("click", connectGemini);
  $("disconnectGemini").addEventListener("click", disconnectGemini);

  $("generate").addEventListener("click", generateWebsite);
  $("applyPromptChanges").addEventListener("click", editWebsite);

  $("saveProject").addEventListener("click", () => saveProject());
  $("exportProject").addEventListener("click", downloadHTML);
  $("downloadPublish").addEventListener("click", downloadZIP);

  $("publishWebsite").addEventListener("click", publishWebsite);

  $("previewWebsite").addEventListener("click", () => {
    if (!html) return;

    const win = window.open("", "_blank");

    if (!win) {
      alert("Allow pop-ups to open the website preview.");
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
  });

  $("desktopView").addEventListener("click", () => {
    mode = "desktop";
    render();
  });

  $("mobileView").addEventListener("click", () => {
    mode = "mobile";
    render();
  });

  $("newProject").addEventListener("click", () => {
    if (!confirm("Start a new project? Saved projects will remain.")) {
      return;
    }

    html = "";
    project = null;
    history = [];

    fieldIds.forEach(id => {
      if (fields[id]) {
        fields[id].value =
          fields[id].type === "color" ? "#3978ff" : "";
      }
    });

    document.querySelectorAll('[name="sections"]')
      .forEach(box => box.checked = true);

    render();
    renderHistory();

    setText("status", "New project ready.");
    setText("editStatus", "Generate or load a website first.");
    setText("publishStatus", "Create a website before publishing.");
  });

  // INITIALIZE

  renderProjects();
  render();
  renderHistory();

  updateConnection(
    getApiKey()
      ? "Gemini key is saved on this device."
      : "AI is not connected."
  );

  $("geminiApiKey").value = "";
});
                         
