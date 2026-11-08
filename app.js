document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const fields = {
    name: $("projectName"), type: $("businessType"), location: $("businessLocation"),
    prompt: $("websitePrompt"), color: $("brandColor"), style: $("designStyle"),
    template: $("templateChoice")
  };
  const buttons = {
    generate: $("generate"), preview: $("previewWebsite"), save: $("saveProject"),
    export: $("exportProject"), publish: $("publishWebsite"), new: $("newProject"),
    desktop: $("desktopView"), mobile: $("mobileView")
  };
  const KEY = "stonic_website_projects_v4";
  let html = "", project = null, timer = null, mode = "desktop", previewTab = null;

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const status = msg => { if ($("status")) $("status").textContent = msg; };
  const sections = () => [...document.querySelectorAll('input[name="sections"]:checked')].map(x => x.value);
  const images = {
    "Dental Clinic":"photo-1629909613654-28e377c37b09",
    Restaurant:"photo-1517248135467-4c7edcad34c4",
    "Real Estate":"photo-1600607687939-ce8a6c25118c",
    "E-commerce":"photo-1441986300917-64674bd600d8",
    Agency:"photo-1497366754035-f200968a6e72",
    Hotel:"photo-1566073771259-6a8506099945",
    Education:"photo-1509062522246-3755977927d7",
    Portfolio:"photo-1497366811353-6870744d04b2"
  };
  const img = type => "https://images.unsplash.com/" + (images[type] || images.Agency) + "?auto=format&fit=crop&w=1400&q=85";

  function sectionHTML(s, d) {
    const n = esc(d.name), photo = img(d.type);
    const map = {
      Services:`<section class="section" id="services"><div class="container"><small>WHAT WE DO</small><h2>Our Services</h2><div class="cards"><article class="card"><h3>Professional Service</h3><p>Quality solutions designed around your needs.</p></article><article class="card"><h3>Expert Support</h3><p>Friendly guidance from our experienced team.</p></article><article class="card"><h3>Trusted Results</h3><p>Careful attention to quality and detail.</p></article></div></div></section>`,
      About:`<section class="section soft" id="about"><div class="container split"><div><small>ABOUT US</small><h2>Built around your needs.</h2><p>${n} is focused on delivering a thoughtful, professional experience.</p></div><img src="${photo}" alt="About ${n}"></div></section>`,
      Team:`<section class="section" id="team"><div class="container"><small>OUR PEOPLE</small><h2>Meet Our Team</h2><div class="cards"><article class="card"><h3>Alex Morgan</h3><p>Senior Specialist</p></article><article class="card"><h3>Jamie Lee</h3><p>Client Experience</p></article><article class="card"><h3>Sam Taylor</h3><p>Operations</p></article></div></div></section>`,
      Gallery:`<section class="section soft" id="gallery"><div class="container"><small>OUR GALLERY</small><h2>A closer look</h2><div class="gallery"><img src="${photo}" alt="Gallery"><img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80" alt="Workspace"></div></div></section>`,
      Reviews:`<section class="section" id="reviews"><div class="container"><small>CLIENT STORIES</small><h2>What people say</h2><div class="cards"><article class="card">★★★★★<p>A professional and welcoming experience.</p></article><article class="card">★★★★★<p>Great attention to detail.</p></article><article class="card">★★★★★<p>Helpful team and smooth service.</p></article></div></div></section>`,
      FAQ:`<section class="section soft" id="faq"><div class="container"><small>QUESTIONS</small><h2>Frequently Asked Questions</h2><details><summary>How can I contact you?</summary><p>Use the contact section below.</p></details><details><summary>Where are you located?</summary><p>${esc(d.location || "Contact us for details.")}</p></details></div></section>`,
      Contact:`<section class="section soft" id="contact"><div class="container"><small>GET IN TOUCH</small><h2>Let's talk about your needs.</h2><p>Contact ${n} to learn more.</p><form id="demoContactForm"><input placeholder="Your name" required><input type="email" placeholder="Your email" required><textarea placeholder="Your message" required></textarea><button>Send message</button></form><p>Demo form only. Connect a secure form service before accepting real messages.</p></div></section>`
    };
    return map[s] || "";
  }

  function build(d) {
    const name = esc(d.name), type = esc(d.type), prompt = esc(d.prompt);
    const color = /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : "#3978ff";
    const dark = d.style === "Luxury";
    const ids = {Services:"services",About:"about",Team:"team",Gallery:"gallery",Reviews:"reviews",FAQ:"faq",Contact:"contact"};
    const nav = (d.sections || []).map(s => ids[s] ? `<a href="#${ids[s]}">${s}</a>` : "").join("");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><style>
:root{--brand:${color};--ink:${dark?"#f8f6f0":"#182238"};--bg:${dark?"#171717":"#fff"};--soft:${dark?"#242424":"#f3f6fb"}}
*{box-sizing:border-box}body{margin:0;font:16px Arial;line-height:1.7;color:var(--ink);background:var(--bg)}img{max-width:100%;display:block}.container{width:min(1120px,90%);margin:auto}
header{padding:20px 5%;display:flex;justify-content:space-between;gap:20px;align-items:center;position:sticky;top:0;background:var(--bg);border-bottom:1px solid #8884}.logo{font-size:22px;font-weight:bold;color:var(--brand)}nav{display:flex;gap:15px;flex-wrap:wrap}nav a{color:var(--ink);text-decoration:none}
.hero{padding:65px 5%;background:var(--soft);display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:center}.hero h1{font-size:clamp(38px,5vw,64px);line-height:1.1}.hero img{width:100%;height:350px;object-fit:cover;border-radius:18px}.hero p{font-size:18px}
small{color:var(--brand);font-weight:bold;letter-spacing:2px}.section{padding:75px 0}.soft{background:var(--soft)}h2{font-size:38px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{padding:24px;border:1px solid #8885;border-radius:12px;background:var(--bg)}.split{display:grid;grid-template-columns:1fr 1fr;gap:35px;align-items:center}.split img{height:300px;width:100%;object-fit:cover;border-radius:16px}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:15px}.gallery img{height:250px;width:100%;object-fit:cover;border-radius:14px}button,.btn{background:var(--brand);color:white;padding:13px 20px;border:0;border-radius:8px;text-decoration:none;display:inline-block}
form{display:grid;gap:12px;max-width:550px}input,textarea{padding:13px;border:1px solid #ccd3df;border-radius:8px;font:inherit}textarea{min-height:100px}footer{text-align:center;padding:25px;background:#111b2c;color:white}
@media(max-width:700px){header{align-items:flex-start;flex-direction:column}.hero,.split{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.gallery{grid-template-columns:1fr}.hero img{height:240px}}
</style></head><body><header><div class="logo">${name}</div><nav><a href="#home">Home</a>${nav}</nav></header><main><section class="hero" id="home"><div><small>${type.toUpperCase()}</small><h1>${name}</h1><p>${prompt}</p><a class="btn" href="#contact">Get in touch</a></div><img src="${img(d.type)}" alt="${type}"></section>${(d.sections||[]).map(s=>sectionHTML(s,d)).join("")}</main><footer>© ${new Date().getFullYear()} ${name}. All rights reserved.</footer><script>document.getElementById("demoContactForm")?.addEventListener("submit",e=>{e.preventDefault();alert("Demo form only.");});<\/script></body></html>`;
  }

  function getData() {
    if (!fields.name?.value.trim() || !fields.prompt?.value.trim()) {
      alert("Enter business name and website description."); return null;
    }
    return {name:fields.name.value.trim(),type:fields.type?.value||"Agency",
      location:fields.location?.value.trim()||"",prompt:fields.prompt.value.trim(),
      color:fields.color?.value||"#3978ff",style:fields.style?.value||"Modern Premium",
      template:fields.template?.value||"Default",sections:sections()};
  }
  function projects() { try{return JSON.parse(localStorage.getItem(KEY)||"[]");}catch{return [];} }
  function renderProjects() {
    const list=$("projectList")||$("projectsList")||$("savedProjects"); if(!list)return;
    list.innerHTML=""; const all=projects();
    if(!all.length){list.textContent="No saved projects yet.";return;}
    all.forEach(p=>{const b=document.createElement("button");b.type="button";b.textContent=p.name;b.style.cssText="display:block;margin:6px 0";b.onclick=()=>load(p);list.appendChild(b);});
  }
  function save(silent=false) {
    if(!project){if(!silent)status("Generate a website first.");return;}
    try {const all=projects(),i=all.findIndex(p=>p.name===project.name);if(i>=0)all[i]=project;else all.unshift(project);localStorage.setItem(KEY,JSON.stringify(all.slice(0,30)));renderProjects();if($("saveStatus"))$("saveStatus").textContent="Saved on this device";if(!silent)status("Project saved.");}
    catch{if(!silent)alert("Storage full. Export your HTML backup.");}
  }
  function render() {
    const holder=$("canvasState");if(!holder||!html)return;
    holder.innerHTML="";const frame=document.createElement("iframe");frame.title="Website preview";frame.setAttribute("sandbox","allow-scripts allow-forms");frame.style.cssText=`width:${mode==="mobile"?"375px":"100%"};max-width:100%;height:650px;border:0`;frame.srcdoc=html;holder.style.display="flex";holder.style.justifyContent="center";holder.appendChild(frame);
    if($("previewStatus"))$("previewStatus").textContent="PREVIEW READY";
    if($("canvasTitle"))$("canvasTitle").textContent=project?.name||"Website Preview";
    if($("canvasDescription"))$("canvasDescription").textContent="Your website concept is ready.";
    if(buttons.preview)buttons.preview.disabled=false;if(buttons.publish)buttons.publish.disabled=false;
  }
  function refreshTab(){if(!previewTab||previewTab.closed)return;try{previewTab.document.open();previewTab.document.write(html);previewTab.document.close();}catch{previewTab=null;}}
  function update(d){html=build(d);project={...d,html,updated:new Date().toISOString()};render();refreshTab();save(true);}
  function generate(){
    const d=getData();if(!d)return;clearInterval(timer);if(buttons.generate)buttons.generate.disabled=true;
    if(buttons.preview)buttons.preview.disabled=true;if(buttons.publish)buttons.publish.disabled=true;
    if($("generationArea"))$("generationArea").hidden=false;status("Preparing website...");
    let p=0;timer=setInterval(()=>{p=Math.min(100,p+10);if($("generationProgress"))$("generationProgress").style.width=p+"%";if($("progressPercent"))$("progressPercent").textContent=p+"%";if($("progressText"))$("progressText").textContent="Building your website...";if(p===100){clearInterval(timer);update(d);if(buttons.generate)buttons.generate.disabled=false;status("Website concept created.");}},100);
  }
  function edit(){
    if(!project){alert("Create or load a website first.");return;}
    const box=$("editPrompt"),raw=box?.value.trim()||"",q=raw.toLowerCase();if(!q){alert("Describe your change first.");return;}
    const d={...project,sections:[...project.sections]};let changed=false;
    const colors={blue:"#3978ff",red:"#e53935",green:"#198754",purple:"#7952b3",orange:"#f08c00",black:"#171717",pink:"#e64980",teal:"#0f9d9a"};
    for(const [word,value] of Object.entries(colors))if(q.includes("color")&&q.includes(word)){d.color=value;if(fields.color)fields.color.value=value;changed=true;break;}
    if(q.includes("dark")||q.includes("luxury")){d.style="Luxury";if(fields.style)fields.style.value=d.style;changed=true;}
    if(q.includes("light")||q.includes("bright")){d.style="Modern Premium";if(fields.style)fields.style.value=d.style;changed=true;}
    const opts=[["services","Services"],["about","About"],["team","Team"],["gallery","Gallery"],["reviews","Reviews"],["faq","FAQ"],["contact","Contact"]];
    for(const [word,s] of opts){if(["add","show","include"].some(x=>q.includes(x))&&q.includes(word)&&!d.sections.includes(s)){d.sections.push(s);changed=true;}if(["remove","hide"].some(x=>q.includes(x))&&q.includes(word)){d.sections=d.sections.filter(x=>x!==s);changed=true;}}
    const m=raw.match(/change name to\s+(.+)/i);if(m?.[1]){d.name=m[1].trim();if(fields.name)fields.name.value=d.name;changed=true;}
    if(changed){document.querySelectorAll('input[name="sections"]').forEach(x=>x.checked=d.sections.includes(x.value));update(d);if($("editStatus"))$("editStatus").textContent="Updated and saved on this device.";box.value="";}else if($("editStatus"))$("editStatus").textContent="Supported: change color, make it dark/light, add/remove sections, change name. Full AI editing is not connected.";
  }
  function addEditor(){
    if($("editPromptPanel"))return;
    const anchor=document.querySelector(".preview-buttons")||$("previewWebsite")?.parentElement||$("canvasState")?.parentElement;
    if(!anchor)return;
    const panel=document.createElement("section");panel.id="editPromptPanel";
    panel.style.cssText="margin:18px 0;padding:18px;border:1px solid #64748b55;border-radius:12px;background:#111827;color:white;width:100%";
    panel.innerHTML='<h3 style="color:white">✦ Edit with Prompt</h3><p style="color:#aab5c7;font-size:13px">Try: Change color to blue · Make it dark · Add gallery · Remove team</p><textarea id="editPrompt" rows="3" placeholder="Describe the change..." style="width:100%;padding:12px;box-sizing:border-box"></textarea><button id="applyPromptChanges" type="button" style="margin-top:10px">Apply Changes</button><p id="editStatus" style="color:#aab5c7" aria-live="polite"></p>';
    anchor.insertAdjacentElement("afterend",panel);$("applyPromptChanges").addEventListener("click",edit);
  }
  function load(p){project={...p};html=p.html||build(p);Object.keys(fields).forEach(k=>{if(fields[k]&&p[k]!==undefined)fields[k].value=p[k];});document.querySelectorAll('input[name="sections"]').forEach(x=>x.checked=(p.sections||[]).includes(x.value));render();status("Project loaded.");}
  function exportHTML(){if(!html){alert("Generate a website first.");return;}const a=document.createElement("a"),url=URL.createObjectURL(new Blob([html],{type:"text/html"}));a.href=url;a.download=(project?.name||"stonic-website").replace(/[^a-z0-9-_]/gi,"-")+".html";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);status("HTML downloaded.");}
  function openPreview(){if(!html){alert("Generate a website first.");return;}if(previewTab&&!previewTab.closed){refreshTab();previewTab.focus();return;}previewTab=window.open("","STONIC_WEBSITE_PREVIEW");if(!previewTab){alert("Allow pop-ups, then tap Open Preview again.");return;}refreshTab();}
  function publish(){if(!html){alert("Generate a website first.");return;}alert("Public publishing is not connected. A hosting/deployment service is required to create a real public link.");}
  function newProject(){if(!confirm("Start a new project? Save or export your current work first."))return;html="";project=null;if(previewTab&&!previewTab.closed)previewTab.close();previewTab=null;if($("canvasState"))$("canvasState").innerHTML="";if($("previewStatus"))$("previewStatus").textContent="NOT READY";if(buttons.preview)buttons.preview.disabled=true;if(buttons.publish)buttons.publish.disabled=true;status("New project ready.");}
  buttons.generate?.addEventListener("click",generate);
  buttons.preview?.addEventListener("click",openPreview);
  buttons.save?.addEventListener("click",()=>save(false));
  buttons.export?.addEventListener("click",exportHTML);
  buttons.publish?.addEventListener("click",publish);
  buttons.new?.addEventListener("click",newProject);
  buttons.desktop?.addEventListener("click",()=>{mode="desktop";render();});
  buttons.mobile?.addEventListener("click",()=>{mode="mobile";render();});
  addEditor();renderProjects();
  if (!$("editPromptPanel")) console.error("STONIC: Edit with Prompt panel could not be mounted; check .preview-buttons in index.html.");
  if(buttons.preview)buttons.preview.disabled=true;if(buttons.publish)buttons.publish.disabled=true;
  if($("connectionStatus"))$("connectionStatus").textContent=navigator.onLine?"Online":"Offline";
  status("Ready. Enter business details to create a website.");
});
      
