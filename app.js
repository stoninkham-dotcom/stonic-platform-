
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

  const say = (id, message) => {
    if ($(id)) $(id).textContent = message;
  };

  const getSections = () =>
    [...document.querySelectorAll('[name="sections"]:checked')]
      .map(item => item.value);

  const getProjects = () => {
    try {
      return JSON.parse(localStorage.getItem(PROJECT_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const slug = value =>
    (value || "website")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

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

  function getApiKey() {
    return localStorage.getItem(API_KEY) || "";
  }

  function updateApiStatus(message) {
    say("apiStatus", message);
    say("connectionStatus", getApiKey() ? "Gemini AI Connected" : "AI Not Connected");
  }

  async function connectGemini() {
    const key = $("geminiApiKey").value.trim();

    if (!key) {
      alert("Enter your Gemini API key first.");
      return;
    }

    $("connectGemini").disabled = true;
    updateApiStatus("Testing Gemini connection...");

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Reply with exactly: STONIC CONNECTED" }] }]
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Gemini connection failed.");
      }

      if (!data.candidates?.[0]?.content?.parts?.length) {
        throw new Error("Gemini returned an empty response.");
      }

      localStorage.setItem(API_KEY, key);
      $("geminiApiKey").value = "";
      updateApiStatus("Connected successfully. Your key is saved on this device.");
    } catch (error) {
      updateApiStatus("Connection failed: " + error.message);
      alert(error.message);
    } finally {
      $("connectGemini").disabled = false;
    }
  }

  function disconnectGemini() {
    if (!confirm("Disconnect Gemini AI on this device?")) return;

    localStorage.removeItem(API_KEY);
    $("geminiApiKey").value = "";
    updateApiStatus("Gemini disconnected.");
  }

  async function askGemini(instruction) {
    const key = getApiKey();

    if (!key) {
      throw new Error("Connect your Gemini API key first.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text:
                "You are STONIC Website Builder. Create and edit complete professional, responsive websites. " +
                "Return only one complete HTML document. Include embedded CSS and JavaScript. " +
                "Do not use Markdown fences or explanations. Preserve all existing website content and features " +
                "unless the user explicitly asks to remove or replace them. Never invent real contact details, " +
                "business claims, or testimonials. Keep the website functional and mobile responsive."
            }]
          },
          contents: [{ role: "user", parts: [{ text: instruction }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 16000
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini request failed.");
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const result = parts.map(part => part.text || "").join("").trim();

    if (!result) {
      throw new Error("Gemini returned no website code.");
    }

    return result
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  function validateHTML(value) {
    if (
      typeof value !== "string" ||
      !/<html[\s>]/i.test(value) ||
      !/<\/html>/i.test(value) ||
      value.length > 500000
    ) {
      throw new Error("AI returned incomplete HTML. Previous website is safe.");
    }

    return value;
  }

  function save() {
    if (!project || !html) return;

    project.html = html;
    project.history = history;
    project.updated = new Date().toISOString();

    const all = getProjects();
    const index = all.findIndex(item => item.id === project.id);

    if (index === -1) all.unshift(project);
    else all[index] = project;

    localStorage.setItem(PROJECT_KEY, JSON.stringify(all.slice(0, 30)));
    renderProjects();
    say("status", "Project saved on this device.");
  }

  function renderProjects() {
    const box = $("projectList");
    box.innerHTML = "";

    const all = getProjects();

    if (!all.length) {
      box.textContent = "No saved projects yet.";
      return;
    }

    all.forEach(item => {
      const card = document.createElement("div");
      card.className = "project-card";

      const title = document.createElement("b");
      title.textContent = item.name || "Untitled website";

      const date = document.createElement("small");
      date.textContent = "Updated " + new Date(item.updated).toLocaleString();

      const openButton = document.createElement("button");
      openButton.textContent = "Open";
      openButton.onclick = () => loadProject(item);

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "soft";
      deleteButton.onclick = () => {
        if (!confirm("Delete this saved project?")) return;

        localStorage.setItem(
          PROJECT_KEY,
          JSON.stringify(getProjects().filter(p => p.id !== item.id))
        );

        renderProjects();
      };

      card.append(title, date, openButton, deleteButton);
      box.append(card);
    });
  }

  function render() {
    const box = $("canvasState");
    box.innerHTML = "";

    if (!html) {
      box.innerHTML = "<h2>Your website starts here</h2><p>Create your first website.</p>";
      say("previewStatus", "NOT GENERATED");
      $("previewWebsite").disabled = true;
      $("applyPromptChanges").disabled = true;
      $("publishWebsite").disabled = true;
      $("downloadPublish").disabled = true;
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
    $("previewWebsite").disabled = false;
    $("applyPromptChanges").disabled = false;
    $("publishWebsite").disabled = false;
    $("downloadPublish").disabled = false;
    say("canvasTitle", project?.name || "Website");
  }

  function renderHistory() {
    const box = $("historyList");
    box.innerHTML = "";

    history.forEach((item, index) => {
      const button = document.createElement("button");
      button.className = "soft";
      button.textContent = "Restore previous version " + (index + 1);

      button.onclick = () => {
        if (!confirm("Restore this previous version?")) return;

        const current = html;
        html = item.html;
        history.splice(index, 1);
        history.unshift({
          html: current,
          at: new Date().toISOString()
        });

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
        id: "p_" + Date.now()
      };
    }

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
    say("status", "STONIC AI is generating your website...");

    try {
      const instruction = [
        "Create a complete professional website.",
        "Business name: " + data.name,
        "Business category: " + data.type,
        "Location: " + (data.location || "Not supplied"),
        "Design style: " + data.style,
        "Brand colour: " + data.color,
        "Template: " + data.template,
        "Required sections: " + data.sections.join(", "),
        "Business description and requirements: " + data.prompt,
        "Return a complete standalone responsive HTML document with embedded CSS and JavaScript.",
        "Make the website polished, accessible and mobile-friendly."
      ].join("\n");

      const result = await askGemini(instruction);

      project = {
        ...data,
        id: "p_" + Date.now()
      };

      history = [];
      commitWebsite(result, "Website generated. You can now edit it with prompts.");
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

    const instruction = $("editPrompt").value.trim();

    if (!instruction) {
      alert("Describe the change you want.");
      return;
    }

    if (!getApiKey()) {
      alert("Connect Gemini AI first.");
      return;
    }

    busy = true;
    $("applyPromptChanges").disabled = true;
    say("editStatus", "STONIC AI is updating your website...");

    try {
      const request = [
        "TASK: Edit the existing website according to the new instruction.",
        "IMPORTANT: The existing website already contains previous user-approved changes.",
        "Preserve all existing sections, text, design choices, features and working code unless the new instruction specifically changes them.",
        "Do not restart the website from scratch.",
        "Do not remove unrelated content.",
        "Apply the new change while keeping all previous changes.",
        "Return the complete updated HTML document, not a partial snippet.",
        "",
        "NEW USER INSTRUCTION:",
        instruction,
        "",
        "EXISTING COMPLETE WEBSITE HTML:",
        html
      ].join("\n");

      const result = await askGemini(request);

      commitWebsite(
        result,
        "Changes saved. Previous changes have been kept. You can send another prompt."
      );

      $("editPrompt").value = "";
      say("status", "Website updated successfully.");
    } catch (error) {
      say(
        "editStatus",
        "Edit failed: " + error.message + " The previous website was not changed."
      );
    } finally {
      busy = false;
      $("applyPromptChanges").disabled = !html;
    }
  }

  function downloadWebsite() {
    if (!html) return;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = slug(project?.name) + ".html";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
    say("publishStatus", "HTML file downloaded. This is not a public live website.");
  }

  function loadProject(item) {
    project = { ...item };
    html = item.html || "";
    history = item.history || [];

    const map = {
      projectName: "name",
      businessType: "type",
      businessLocation: "location",
      websitePrompt: "prompt",
      brandColor: "color",
      designStyle: "style",
      templateChoice: "template"
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
  $("exportProject").onclick = downloadWebsite;
  $("downloadPublish").onclick = downloadWebsite;

  $("publishWebsite").onclick = () => {
    say(
      "publishStatus",
      "Public GitHub Pages publishing is not connected yet. Your website has not been published."
    );
  };

  $("previewWebsite").onclick = () => {
    if (!html) return;

    const win = window.open("", "_blank");

    if (!win) {
      alert("Allow pop-ups to open the website preview.");
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  $("desktopView").onclick = () => {
    mode = "desktop";
    render();
  };

  $("mobileView").onclick = () => {
    mode = "mobile";
    render();
  };

  $("newProject").onclick = () => {
    if (!confirm("Start a new project? Saved projects will remain.")) return;

    html = "";
    project = null;
    history = [];

    ids.forEach(id => {
      if (fields[id]) {
        fields[id].value =
          fields[id].type === "color" ? "#3978ff" : "";
      }
    });

    render();
    renderHistory();
    say("status", "New project ready.");
    say("editStatus", "Generate or load a website first.");
  };

  renderProjects();
  render();
  updateApiStatus(getApiKey()
    ? "Gemini key is saved on this device. Reconnect test not required."
    : "AI is not connected."
  );

  $("geminiApiKey").value = "";
  $("applyPromptChanges").disabled = true;
});
                                  
