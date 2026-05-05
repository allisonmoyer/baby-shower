(function () {
  const STORAGE_KEY = "baby-shower-submissions";
  const defaultConfig = {
    eventTitle: "Allie + Mel's Baby Shower",
    parents: {
      allie: "Allie",
      mel: "Melissa"
    },
    submission: {
      mode: "google-apps-script",
      endpoint: "",
      sheetLinks: {
        combined: "",
        allie: "",
        mel: "",
        both: "",
        traditions: "",
        advice: ""
      }
    }
  };

  const config = mergeConfig(defaultConfig, window.BABY_SHOWER_CONFIG || {});

  document.querySelectorAll("[data-event-title]").forEach((node) => {
    node.textContent = config.eventTitle;
  });

  initializeEntryForm();
  initializeDashboard();

  function initializeEntryForm() {
    const form = document.querySelector("[data-entry-form]");

    if (!form) {
      return;
    }

    const successState = document.querySelector("[data-success-state]");
    const statusCopy = document.querySelector("[data-status-copy]");
    const successCopy = document.querySelector("[data-success-copy]");
    const resetButton = document.querySelector("[data-reset-form]");
    const segments = Array.from(form.querySelectorAll("[data-recipient-option]"));
    const recipientInput = form.querySelector('input[name="recipient"]');
    const formType = form.dataset.entryForm;
    const submitButton = form.querySelector('button[type="submit"]');
    const eventTitleInput = form.querySelector('input[name="eventTitle"]');
    const submittedAtInput = form.querySelector('input[name="submittedAt"]');
    const iframe = document.querySelector('iframe[name="submission-frame"]');
    let waitingForIframe = false;

    restoreHiddenDefaults();

    if (statusCopy) {
      statusCopy.textContent = isRemoteMode()
        ? "Notes are sent to your private Google Sheet."
        : "Add your Google Apps Script URL in config.js. Until then, entries are saved locally in this browser.";
    }

    segments.forEach((button) => {
      button.textContent = recipientLabel(button.dataset.recipientOption);
      button.addEventListener("click", () => {
        setRecipient(button.dataset.recipientOption);
      });
    });

    const presetRecipient = new URLSearchParams(window.location.search).get("to");
    setRecipient(isValidRecipient(presetRecipient) ? presetRecipient : recipientInput.value);

    if (iframe) {
      iframe.addEventListener("load", () => {
        if (!waitingForIframe) {
          return;
        }

        waitingForIframe = false;
        form.classList.remove("is-busy");
        if (submitButton) {
          submitButton.disabled = false;
        }
        showSuccess(successText(formType, recipientInput.value, true));
        form.reset();
        restoreHiddenDefaults();
        setRecipient("both");
      });
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      clearValidation(form);

      if (!validateForm(form)) {
        return;
      }

      const payload = buildPayload(formType, form);
      submittedAtInput.value = payload.submittedAt;

      if (isRemoteMode()) {
        waitingForIframe = true;
        form.classList.add("is-busy");
        if (submitButton) {
          submitButton.disabled = true;
        }
        form.action = config.submission.endpoint;
        form.method = "POST";
        form.target = "submission-frame";
        HTMLFormElement.prototype.submit.call(form);
        return;
      }

      saveLocalSubmission(payload);
      showSuccess(successText(formType, payload.recipient, false));
      form.reset();
      restoreHiddenDefaults();
      setRecipient("both");
    });

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        successState.hidden = true;
        form.hidden = false;
        form.reset();
        restoreHiddenDefaults();
        clearValidation(form);
        setRecipient("both");
      });
    }

    function restoreHiddenDefaults() {
      if (eventTitleInput) {
        eventTitleInput.value = config.eventTitle;
      }
      if (submittedAtInput) {
        submittedAtInput.value = "";
      }
    }

    function setRecipient(value) {
      recipientInput.value = value;
      segments.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.recipientOption === value);
      });
    }

    function showSuccess(message) {
      if (successCopy) {
        successCopy.textContent = message;
      }
      form.hidden = true;
      successState.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function initializeDashboard() {
    const statsRoot = document.querySelector("[data-dashboard-stats]");
    const listRoot = document.querySelector("[data-dashboard-list]");
    const sheetLinksRoot = document.querySelector("[data-sheet-links]");
    const clearButton = document.querySelector("[data-clear-local]");

    if (!statsRoot || !listRoot || !sheetLinksRoot) {
      return;
    }

    renderSheetLinks(sheetLinksRoot);
    renderDashboard(statsRoot, listRoot);

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        window.localStorage.removeItem(STORAGE_KEY);
        renderDashboard(statsRoot, listRoot);
      });
    }
  }

  function renderDashboard(statsRoot, listRoot) {
    const items = getLocalSubmissions();
    const traditionCount = items.filter((item) => item.formType === "tradition").length;
    const adviceCount = items.filter((item) => item.formType === "advice").length;
    const bothCount = items.filter((item) => item.recipient === "both").length;
    const allieCount = items.filter((item) => item.recipient === "allie").length;
    const melCount = items.filter((item) => item.recipient === "mel").length;

    statsRoot.innerHTML = [
      statCard("Local entries", items.length),
      statCard("Traditions", traditionCount),
      statCard("Advice", adviceCount),
      statCard("Send to both", bothCount),
      statCard(`${config.parents.allie} only`, allieCount),
      statCard(`${config.parents.mel} only`, melCount)
    ].join("");

    if (items.length === 0) {
      listRoot.innerHTML = '<div class="empty-state">No local preview entries yet.</div>';
      return;
    }

    listRoot.innerHTML = items
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
      .map((item) => {
        const heading = item.formType === "tradition" ? item.title || "Tradition" : "Advice & well wishes";
        const guest = item.guestName ? item.guestName : "Anonymous";
        return `
          <article class="entry-card">
            <div class="entry-meta">
              <span class="entry-type">${escapeHtml(titleCase(item.formType))}</span>
              <span>${escapeHtml(recipientLabel(item.recipient))}</span>
              <span>${escapeHtml(guest)}</span>
              <span>${escapeHtml(formatDate(item.submittedAt))}</span>
            </div>
            <h3>${escapeHtml(heading)}</h3>
            <p>${escapeHtml(item.message)}</p>
            ${item.timing ? `<p><strong>Timing:</strong> ${escapeHtml(item.timing)}</p>` : ""}
          </article>
        `;
      })
      .join("");
  }

  function renderSheetLinks(root) {
    const links = Object.entries(config.submission.sheetLinks)
      .filter(([, href]) => Boolean(href))
      .map(([key, href]) => ({
        key,
        href,
        label: sheetLinkLabel(key)
      }));

    if (links.length === 0) {
      root.innerHTML = '<div class="empty-state">Add your Google Sheet links in config.js and they will show up here.</div>';
      return;
    }

    root.innerHTML = links
      .map((link) => `<a class="sheet-link" href="${escapeAttribute(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
      .join("");
  }

  function buildPayload(formType, form) {
    const data = new FormData(form);
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `entry-${Date.now()}`,
      formType,
      recipient: data.get("recipient"),
      guestName: cleanValue(data.get("guestName")),
      title: cleanValue(data.get("title")),
      message: cleanValue(data.get("message")),
      timing: cleanValue(data.get("timing")),
      eventTitle: config.eventTitle,
      submittedAt: new Date().toISOString()
    };
  }

  function validateForm(form) {
    let isValid = true;

    form.querySelectorAll("input[required], textarea[required]").forEach((field) => {
      const value = field.value.trim();
      if (value) {
        return;
      }

      field.classList.add("is-invalid");
      field.addEventListener("input", handleFieldFix, { once: true });
      if (isValid) {
        field.focus();
      }
      isValid = false;
    });

    return isValid;
  }

  function clearValidation(form) {
    form.querySelectorAll(".is-invalid").forEach((field) => {
      field.classList.remove("is-invalid");
    });
  }

  function handleFieldFix(event) {
    event.currentTarget.classList.remove("is-invalid");
  }

  function saveLocalSubmission(payload) {
    const current = getLocalSubmissions();
    current.push(payload);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }

  function getLocalSubmissions() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function isRemoteMode() {
    return config.submission.mode === "google-apps-script" && Boolean(config.submission.endpoint);
  }

  function successText(formType, recipient, isRemote) {
    const target = recipientLabel(recipient).replace("Send to ", "");
    const destination = isRemote ? "and sent to the Google Sheet" : "locally while Sheets is not connected";

    if (formType === "tradition") {
      return `Your tradition was saved ${destination} for ${target}.`;
    }

    return `Your note was saved ${destination} for ${target}.`;
  }

  function recipientLabel(value) {
    if (value === "allie") {
      return `Send to ${config.parents.allie}`;
    }
    if (value === "mel") {
      return `Send to ${config.parents.mel}`;
    }
    return "Send to both";
  }

  function isValidRecipient(value) {
    return value === "both" || value === "allie" || value === "mel";
  }

  function mergeConfig(base, override) {
    return {
      ...base,
      ...override,
      parents: {
        ...base.parents,
        ...(override.parents || {})
      },
      submission: {
        ...base.submission,
        ...(override.submission || {}),
        sheetLinks: {
          ...base.submission.sheetLinks,
          ...((override.submission && override.submission.sheetLinks) || {})
        }
      }
    };
  }

  function titleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function sheetLinkLabel(value) {
    if (value === "combined") {
      return "All submissions";
    }
    if (value === "allie") {
      return `${config.parents.allie} view`;
    }
    if (value === "mel") {
      return `${config.parents.mel} view`;
    }
    if (value === "both") {
      return "Send to both";
    }
    if (value === "traditions") {
      return "Traditions";
    }
    if (value === "advice") {
      return "Advice";
    }
    return titleCase(value);
  }

  function cleanValue(value) {
    return String(value || "").trim();
  }

  function formatDate(value) {
    const date = new Date(value);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function statCard(label, value) {
    return `
      <article class="stat-card">
        <p class="stat-label">${escapeHtml(label)}</p>
        <p class="stat-value">${escapeHtml(String(value))}</p>
      </article>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
