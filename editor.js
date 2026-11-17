
(function () {
  "use strict";

  const STONICEditor = {
    validateHTML(html) {
      if (typeof html !== "string" || !html.trim()) {
        return {
          valid: false,
          message: "Website HTML is empty."
        };
      }

      if (
        !/<html[\s>]/i.test(html) ||
        !/<\/html>/i.test(html) ||
        !/<body[\s>]/i.test(html) ||
        !/<\/body>/i.test(html)
      ) {
        return {
          valid: false,
          message: "A complete HTML document is required."
        };
      }

      if (html.length > 500000) {
        return {
          valid: false,
          message: "Website is too large."
        };
      }

      return {
        valid: true,
        message: "HTML document is valid."
      };
    },

    createBackup(html) {
      return {
        html: html,
        createdAt: new Date().toISOString()
      };
    },

    restoreBackup(backup) {
      if (!backup || typeof backup.html !== "string") {
        throw new Error("Invalid website backup.");
      }

      return backup.html;
    },

    createDocument(html) {
      const result = this.validateHTML(html);

      if (!result.valid) {
        throw new Error(result.message);
      }

      return new Blob([html], {
        type: "text/html;charset=utf-8"
      });
    }
  };

  window.STONICEditor = STONICEditor;
})();
