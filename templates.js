
window.STONIC_TEMPLATES = [
  {
    id: "modern-business",
    name: "Modern Business",
    category: "Business",
    description: "Clean and professional business website",
    html: `
      <header class="site-header">
        <h1>Your Business</h1>
        <nav>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <main>
        <section id="home" class="hero">
          <h2>Build Something Great</h2>
          <p>We help your business grow with professional services.</p>
          <a class="cta" href="#contact">Contact Us</a>
        </section>
        <section id="about">
          <h2>About Us</h2>
          <p>Tell visitors about your business and what makes it special.</p>
        </section>
        <section id="services">
          <h2>Our Services</h2>
          <p>Describe the services you provide to your customers.</p>
        </section>
        <section id="contact">
          <h2>Contact Us</h2>
          <p>Email: hello@example.com</p>
        </section>
      </main>
      <footer>© 2026 Your Business. All rights reserved.</footer>
    `,
    css: `
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        color: #172033;
        line-height: 1.6;
      }
      .site-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 8%;
        background: #fff;
      }
      nav a {
        margin-left: 18px;
        color: #172033;
        text-decoration: none;
      }
      section { padding: 70px 8%; }
      .hero {
        background: #eaf1ff;
        text-align: center;
        padding: 110px 8%;
      }
      .hero h2 { font-size: 42px; }
      .cta {
        display: inline-block;
        padding: 12px 24px;
        background: #2563eb;
        color: white;
        border-radius: 8px;
        text-decoration: none;
      }
      footer {
        padding: 25px;
        text-align: center;
        background: #172033;
        color: white;
      }
      @media (max-width: 600px) {
        .site-header { flex-direction: column; gap: 12px; }
        nav a { margin: 0 7px; }
        .hero h2 { font-size: 30px; }
      }
    `
  }
];
