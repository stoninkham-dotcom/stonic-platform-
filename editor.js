
window.STONIC_EDITOR = {
  applyTemplate: function (templateId) {
    const templates = window.STONIC_TEMPLATES || [];
    const template = templates.find(item => item.id === templateId);

    if (!template) {
      return {
        success: false,
        message: "Template not found."
      };
    }

    return {
      success: true,
      html: template.html,
      css: template.css,
      name: template.name
    };
  },

  updateText: function (html, oldText, newText) {
    if (!oldText || typeof html !== "string") {
      return html;
    }

    return html.replace(oldText, newText);
  },

  updateColor: function (css, oldColor, newColor) {
    if (!oldColor || typeof css !== "string") {
      return css;
    }

    return css.replaceAll(oldColor, newColor);
  },

  validateWebsite: function (html) {
    const issues = [];

    if (!html || typeof html !== "string") {
      issues.push("Website HTML is empty.");
    } else {
      if (!html.includes("<title>")) {
        issues.push("Page title is missing.");
      }

      if (!html.includes("<meta name=\"viewport\"")) {
        issues.push("Mobile viewport meta tag is missing.");
      }

      if (!html.includes("<body")) {
        issues.push("Body element is missing.");
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }
};
      
