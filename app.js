
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const PROJECT_KEY = "stonic_projects_v6";
  const API_KEY = "stonic_gemini_key";
  const MODEL = "gemini-2.5-flash";

  let html = "";
  let project = null;
  let history = [];
  let mode = "desktop";
  let busy = false;

  const ids = [
    "projectName", "businessType", "businessLocation",
    "websitePrompt", "brandColor", "designStyle", "templateChoice"
  ];
  const fields = Object.fromEntries(ids.map(id => [id, $(id)]));
  const say = (id, message) => { if ($(id)) $(id).textContent = message; };

  const getSections = () =>
    [...document.querySelectorAll('[name="sections"]:checked')].map(x => x.value);

  const getProjects = () => {
    try { return JSON.parse(localStorage.getItem(PROJECT_KEY) || "[]"); }
    catch { return []; }
  };

  const slug = value => (value || "website").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

  const getApiKey = () => localStorage.getItem(API_KEY) || "";

  function updateApiStatus(message) {
    say("apiStatus", message);
    say("connectionStatus", getApiKey() ? "Gemini AI Connected" : "AI Not Connected");
  }

  async function geminiRequest(key, contents, systemText) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText || "You are STONIC AI." }] },
          contents: [{ role: "user", parts: [{ text: contents }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 16000 }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gemini request failed.");
    const result = (data.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "").join("").trim();
    if (!result) throw new Error("Gemini returned an empty response.");
    return result.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  async function connectGemini() {
    const key = $("geminiApiKey").value.trim();
    if (!key) return alert("Enter your Gemini API key first.");
    $("connectGemini").disabled = true;
    updateApiStatus("Testing connection...");
    try {
      await geminiRequest(key, "Reply exactly: STONIC CONNECTED");
      localStorage.setItem(API_KEY, key);
      $("geminiApiKey").value = "";
      updateApiStatus("Gemini connected and saved on this device.");
    } catch (error) {
      updateApiStatus("Connection failed: " + error.message);
      alert(error.message);
    } finally {
      $("connectGemini").disabled = false;
    }
  }

  function disconnectGemini() {
    if (!confirm("Disconnect Gemini on this device?")) return;
    localStorage.removeItem(API_KEY);
    $("geminiApiKey").value = "";
    updateApiStatus("Gemini disconnected.");
  }

  async function askGemini(instruction) {
    const key = getApiKey();
    if (!key) throw new Error("Connect Gemini AI first.");
    return geminiRequest(
      key,
      instruction,
      "You are STONIC Website Builder. Return only a complete standalone HTML document. " +
      "Use embedded CSS and JavaScript. Make it responsive, accessible and professional. " +
      "Never invent real contact details, claims or testimonials. Preserve existing features."
    );
  }

  function validateHTML(value) {
    if (typeof value !== "string" || !/<html[\s>]/i.test(value) ||
        !/<\/html>/i.test(value) || value.length > 500000) {
      throw new Error("Incomplete website HTML. Previous version remains safe.");
    }
    return value;
  }

  function save() {
    if (!project || !html) return;
    project.html = html;
    project.history = history;
    project.updated = new Date().toISOString();
    const all = getProjects();
    const index = all.findIndex(x => x.id === project.id);
    if (index < 0) all.unshift(project);
    else all[index] = project;
    localStorage.setItem(PROJECT_KEY, JSON.stringify(all.slice(0, 30)));
    renderProjects();
    say("status", "Project saved on this device.");
  }

  function renderProjects() {
    const box = $("projectList");
    box.innerHTML = "";
    const all = getProjects();
    if (!all.length) return box.textContent = "No saved projects yet.";

    all.forEach(item => {
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
        if (!confirm("Delete this project?")) return;
        localStorage.setItem(PROJECT_KEY,
          JSON.stringify(getProjects().filter(x => x.id !== item.id)));
        renderProjects();
      };
      card.append(title, open, remove);
      box.append(card);
    });
  }

  function render() {
    const box = $("canvasState");
    box.innerHTML = "";
    if (!html) {
      box.innerHTML = "<h2>Your website starts here</h2><p>Create your first website.</p>";
      say("previewStatus", "NOT GENERATED");
      ["previewWebsite", "applyPromptChanges", "publishWebsite", "downloadPublish"]
        .forEach(id => $(id).disabled = true);
      return;
    }
    const frame = document.createElement("iframe");
    frame.title = "Website preview";
    frame.sandbox = "allow-scripts allow-forms";
    frame.style.width = mode === "mobile" ? "375px" : "100%";
    frame.style.maxWidth = "100%";
    frame.style.minHeight = "620px";
    frame.srcdoc = html;
    box.append(frame);
    say("previewStatus", "PREVIEW READY");
    ["previewWebsite", "applyPromptChanges", "publishWebsite", "downloadPublish"]
      .forEach(id => $(id).disabled = false);
  }

  function renderHistory() {
    const box = $("historyList");
    box.innerHTML = "";
    history.forEach((item, index) => {
      const button = document.createElement("button");
      button.className = "soft";
      button.textContent = "Restore version " + (index + 1);
      button.onclick = () => {
        if (!confirm("Restore this version?")) return;
        const current = html;
        html = item.html;
        history.splice(index, 1);
        history.unshift({ html: current, at: new Date().toISOString() });
        history = history.slice(0, 8);
        render();
        save();
        renderHistory();
        say("editStatus", "Previous version restored.");
      };
      box.append(button);
    });
  }

  function commitWebsite(nextHTML, message) {
    nextHTML = validateHTML(nextHTML);
    if (html) history.unshift({ html, at: new Date().toISOString() });
    history = history.slice(0, 8);
    html = nextHTML;
    if (!project) project = { ...getData(), id: "p_" + Date.now() };
    project.html = html;
    project.history = history;
    render();
    save();
    renderHistory();
    say("editStatus", message);
  }

  async function generateWebsite() {
    if (busy) return;
    const data = getData();
    if (!data.name || !data.prompt) return alert("Enter business name and website description.");
    if (!getApiKey()) return alert("Connect Gemini AI first.");
    busy = true;
    $("generate").disabled = true;
    say("status", "STONIC AI is generating your website...");
    try {
      const result = await askGemini([
        "Create a complete professional responsive website.",
        "Business: " + data.name,
        "Category: " + data.type,
        "Location: " + (data.location || "Not supplied"),
        "Design: " + data.style,
        "Brand colour: " + data.color,
        "Template: " + data.template,
        "Sections: " + data.sections.join(", "),
        "Requirements: " + data.prompt,
        "Return one complete standalone HTML document."
      ].join("\n"));
      project = { ...data, id: "p_" + Date.now() };
      history = [];
      commitWebsite(result, "Website generated. You can edit it with prompts.");
      say("status", "Website generated successfully.");
    } catch (error) {
      say("status", "Generation failed: " + error.message);
      alert(error.message);
    } finally {
      busy = false;
      $("generate").disabled = false;
    }
  }

  async function editWebsite() {
    if (busy || !html) return;
    const prompt = $("editPrompt").value.trim();
    if (!prompt) return alert("Describe the change you want.");
    if (!getApiKey()) return alert("Connect Gemini AI first.");
    busy = true;
    $("applyPromptChanges").disabled = true;
    say("editStatus", "Updating current website...");
    try {
      const result = await askGemini(
        "Edit this existing website. Apply ONLY the requested changes. " +
        "Preserve all previous approved changes, existing sections and working features. " +
        "Do not rebuild from scratch or remove unrelated content. Return the full HTML.\n\n" +
        "NEW CHANGE:\n" + prompt + "\n\nCURRENT WEBSITE:\n" + html
      );
      commitWebsite(result, "Changes saved. Previous version is in history.");
      $("editPrompt").value = "";
    } catch (error) {
      say("editStatus", "Edit failed. Previous website is unchanged. " + error.message);
    } finally {
      busy = false;
      $("applyPromptChanges").disabled = !html;
    }
  }

  function crc32(bytes) {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++)
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return (crc ^ -1) >>> 0;
  }

  function zipBlob(files) {
    const encoder = new TextEncoder();
    const local = [], central = [];
    let offset = 0;
    const u16 = n => [n & 255, (n >>> 8) & 255];
    const u32 = n => [...u16(n & 65535), ...u16(n >>> 16)];
    for (const file of files) {
      const name = encoder.encode(file.name);
      const data = encoder.encode(file.content);
      const crc = crc32(data);
      const header = new Uint8Array([
        0x50,0x4b,3,4,20,0,0,0,0,0,0,0,0,0,
        ...u32(crc), ...u32(data.length), ...u32(data.length),
        ...u16(name.length),0,0,...name
      ]);
      local.push(header, data);
      const centralHeader = new Uint8Array([
        0x50,0x4b,1,2,20,0,20,0,0,0,0,0,0,0,
        ...u32(crc), ...u32(data.length), ...u32(data.length),
        ...u16(name.length),0,0,0,0,0,0,0,0,0,0,...u32(offset),...name
      ]);
      central.push(centralHeader);
      offset += header.length + data.length;
    }
    const centralSize = central.reduce((n, x) => n + x.length, 0);
    const end = new Uint8Array([
      0x50,0x4b,5,6,0,0,0,0,
      ...u16(files.length),...u16(files.length),
      ...u32(centralSize),...u32(offset),0,0
    ]);
    return new Blob([...local, ...central, end], { type: "application/zip" });
  }

  function downloadZIP() {
    if (!html) return;
    const name = slug($("deliveryClientName").value || project?.name);
    const files = [{ name: "index.html", content: html }];
    if ($("deliveryIncludeReadme")?.checked !== false) {
      files.push({
        name: "README.txt",
        content: "STONIC CLIENT WEBSITE\n\nOpen index.html in a browser.\n" +
          "For public hosting, publish this folder through the configured hosting workflow.\n"
      });
    }
    const url = URL.createObjectURL(zipBlob(files));
    const link = document.createElement("a");
    link.href = url;
    link.download = name + "-website.zip";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    say("publishStatus", "Website ZIP downloaded. Public publishing is a separate step.");
  }

  function downloadHTML() {
    if (!html) return;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = slug(project?.name) + ".html";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function loadProject(item) {
    project = { ...item };
    html = item.html || "";
    history = item.history || [];
    const map = {
      projectName: "name", businessType: "type",
      businessLocation: "location", websitePrompt: "prompt",
      brandColor: "color", designStyle: "style", templateChoice: "template"
    };
    ids.forEach(id => {
      const value = item[map[id]];
      if (fields[id] && value != null) fields[id].value = value;
    });
    document.querySelectorAll('[name="sections"]').forEach(box => {
      box.checked = (item.sections || []).includes(box.value);
    });
    render();
    renderHistory();
    say("status", "Project loaded.");
  }

  $("connectGemini").onclick = connectGemini;
  $("disconnectGemini").onclick = disconnectGemini;
  $("generate").onclick = generateWebsite;
  $("applyPromptChanges").onclick = editWebsite;
  $("saveProject").onclick = save;
  $("exportProject").onclick = downloadHTML;
  $("downloadPublish").onclick = downloadZIP;

  $("publishWebsite").onclick = () => {
    say("publishStatus",
      "Publishing integration is not connected yet. No public website has been published.");
  };

  $("previewWebsite").onclick = () => {
    if (!html) return;
    const win = window.open("", "_blank");
    if (!win) return alert("Allow pop-ups to open preview.");
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  $("desktopView").onclick = () => { mode = "desktop"; render(); };
  $("mobileView").onclick = () => { mode = "mobile"; render(); };

  $("newProject").onclick = () => {
    if (!confirm("Start a new project? Saved projects remain available.")) return;
    html = ""; project = null; history = [];
    ids.forEach(id => {
      if (fields[id]) fields[id].value =
        fields[id].type === "color" ? "#3978ff" : "";
    });
    render(); renderHistory();
    say("status", "New project ready.");
    say("editStatus", "Generate or load a website first.");
  };

  renderProjects();
  render();
  updateApiStatus(getApiKey()
    ? "Gemini key is saved on this device."
    : "AI is not connected.");
  $("geminiApiKey").value = "";
});
  
