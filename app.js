const $ = id => document.getElementById(id);
let site = null;
const KEY = "stonic_projects_v2";

const esc = s => String(s || "").replace(/[&<>"]/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
}[c]));

function build() {
  const name = $("projectName").value.trim() || "Your Business";
  const type = $("businessType").value.trim() || "Business";
  const prompt = $("websitePrompt").value.trim();
  const color = $("brandColor").value;

  const kind = (name + " " + type + " " + prompt).toLowerCase();
  const clinic = /clinic|dental|doctor|medical|health/.test(kind);
  const food = /restaurant|cafe|food|bakery/.test(kind);

  const services = clinic
    ? ["General dentistry", "Teeth cleaning", "Cosmetic dentistry", "Dental consultation"]
    : food
    ? ["Our menu", "Daily specials", "Private events", "Takeaway"]
    : ["Our services", "Expert consultation", "Custom solutions", "Ongoing support"];

  const headline = clinic
    ? "Care that puts your smile first."
    : food
    ? "Fresh flavours. Warm welcomes."
    : "A better experience starts here.";

  const cards = services.map((s, i) =>
    `<article><small>0${i + 1}</small><h3>${s}</h3>
    <p>Thoughtful professional service designed around your needs.</p></article>`
  ).join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;font:16px Arial;color:#17243d;line-height:1.6}
header{padding:20px 7%;display:flex;justify-content:space-between;border-bottom:1px solid #eee;font-weight:bold}
nav a{margin-left:20px;color:#526078;text-decoration:none;font-size:13px}
.hero{padding:90px 8%;background:linear-gradient(120deg,#eef4ff,#fff);display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center}
.tag,article small{color:${color};font-weight:bold;letter-spacing:2px;text-transform:uppercase}
.hero h1{font-size:clamp(38px,6vw,65px);line-height:1.05;margin:15px 0}
.hero p,.intro{color:#65728a;max-width:570px}
.visual{background:linear-gradient(140deg,${color},#122341);border-radius:24px;min-height:280px;display:grid;place-items:center;color:white;font-size:80px}
.btn{display:inline-block;background:${color};color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold}
.section{padding:70px 8%}
.section h2{font-size:34px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-top:25px}
article{border:1px solid #e5eaf2;border-radius:14px;padding:20px}
article p{font-size:13px;color:#65728a}
.about{background:#f5f7fb}
.contact{background:#101e39;color:white}
.contact p{color:#c5cede}
.form{max-width:520px;display:grid;gap:12px}
.form input,.form textarea{padding:13px;border:1px solid #dce3ee;border-radius:8px;font:inherit}
.foot{padding:25px 8%;background:#091427;color:#c5cede;font-size:12px}
@media(max-width:700px){
nav{display:none}
.hero{grid-template-columns:1fr;padding:60px 7%}
.visual{min-height:170px}
.section{padding:55px 7%}
.cards{grid-template-columns:1fr 1fr}
}
@media(max-width:420px){.cards{grid-template-columns:1fr}}
</style>
</head>
<body>

<header>
<span>${esc(name)}</span>
<nav>
<a href="#home">Home</a>
<a href="#services">Services</a>
<a href="#about">About</a>
<a href="#contact">Contact</a>
</nav>
<a class="btn" href="#contact">Contact us</a>
</header>

<section class="hero" id="home">
<div>
<div class="tag">${esc(type)}</div>
<h1>${headline}</h1>
<p>${esc(prompt)}</p>
<a class="btn" href="#contact">Get started →</a>
</div>
<div class="visual">✦</div>
</section>

<section class="section" id="services">
<div class="tag">WHAT WE DO</div>
<h2>Services designed around you</h2>
<p class="intro">Explore how we can help. Our team is ready to guide you through the next step.</p>
<div class="cards">${cards}</div>
</section>

<section class="section about" id="about">
<div class="tag">ABOUT US</div>
<h2>People first. Quality always.</h2>
<p class="intro">${esc(name)} believes in clear communication, trusted expertise and an experience that puts you first.</p>
</section>

<section class="section contact" id="contact">
<div class="tag">CONTACT</div>
<h2>Let's talk</h2>
<p>This is a visual demo form. It does not send appointment requests yet.</p>
<form class="form" onsubmit="event.preventDefault();alert('Demo only — connect a booking service to receive requests.');">
<input required placeholder="Your name">
<input required type="email" placeholder="Email address">
<textarea rows="4" placeholder="How can we help?"></textarea>
<button class="btn">Send request</button>
</form>
</section>

<footer class="foot">
© ${new Date().getFullYear()} ${esc(name)} · Website concept by STONIC
</footer>

</body>
</html>`;

  return { name, type, prompt, color, html, updated: new Date().toISOString() };
}

function generate() {
  site = build();
  $("canvasTitle").textContent = site.name + " website";
  $("canvasDescription").textContent =
    "Professional responsive concept ready. Open the full page in a separate tab.";
  $("canvasState").textContent = "CONCEPT READY";
  $("previewWebsite").disabled = false;
  $("status").textContent = "Concept ready — open Preview website in a new tab.";
}

function projects() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function render() {
  const list = projects();

  $("projectList").innerHTML = list.length
    ? list.map(x => `
      <div class="project">
        <span><b>${esc(x.name)}</b><br>
        ${new Date(x.updated).toLocaleString()}</span>
        <button data-id="${x.id}">Open</button>
      </div>`).join("")
    : "Your saved projects will appear here.";

  document.querySelectorAll("[data-id]").forEach(b => {
    b.onclick = () => {
      const x = projects().find(p => p.id == b.dataset.id);
      if (!x) return;

      site = x;
      $("projectName").value = x.name;
      $("businessType").value = x.type;
      $("websitePrompt").value = x.prompt;
      $("brandColor").value = x.color;
      $("canvasTitle").textContent = x.name + " website";
      $("canvasDescription").textContent = "Saved project loaded. Preview it in a separate tab.";
      $("canvasState").textContent = "SAVED PROJECT";
      $("previewWebsite").disabled = false;
    };
  });
}

$("generate").onclick = generate;

$("saveProject").onclick = () => {
  if (!site) generate();

  const list = projects();
  list.unshift({ ...site, id: Date.now() });

  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
  render();
  $("status").textContent = "Project saved in this browser.";
};

$("previewWebsite").onclick = () => {
  if (!site) return;

  const url = URL.createObjectURL(
    new Blob([site.html], { type: "text/html" })
  );

  const tab = window.open(url, "_blank");

  if (!tab) {
    $("status").textContent = "Pop-up blocked. Allow pop-ups and try again.";
  }

  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

$("exportProject").onclick = () => {
  if (!site) generate();

  const url = URL.createObjectURL(
    new Blob([site.html], { type: "text/html" })
  );

  const a = document.createElement("a");
  a.href = url;
  a.download = "stonic-website.html";
  a.click();

  URL.revokeObjectURL(url);
};

$("newProject").onclick = () => {
  site = null;
  $("projectName").value = "";
  $("businessType").value = "";
  $("websitePrompt").value = "";
  $("canvasTitle").textContent = "Your website starts here";
  $("canvasDescription").textContent =
    "Add your business details and create a website concept.";
  $("canvasState").textContent = "NOT GENERATED";
  $("previewWebsite").disabled = true;
  $("status").textContent = "New project ready.";
};

render();
