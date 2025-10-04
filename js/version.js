// Single source of truth for app version (used by drawer footer, etc.)
(function () {
  const SOURCE_VERSION = "v2.0.0";
  window.DF_VERSION = SOURCE_VERSION;

  const extractRaw = (input) => {
    if (typeof input === "string") return input;
    if (input && typeof input === "object") {
      const cand = input.app ?? input.version ?? input.tag ?? input.v ?? input.value;
      return cand != null ? String(cand) : "";
    }
    return "";
  };

  const normalize = (value) => {
    const raw = extractRaw(value).trim();
    if (!raw) return "";
    if (/^v/i.test(raw)) return raw.replace(/^V/, "v");
    return `v${raw}`;
  };

  const formatForNode = (node) => {
    const normalized = normalize(window.DF_VERSION);
    if (!normalized) return "";
    const mode = node.getAttribute("data-version-slot") || (node.id === "version" ? "plain" : "app");
    const prefix = node.getAttribute("data-version-prefix") || "";
    const suffix = node.getAttribute("data-version-suffix") || "";

    let payload = normalized;
    if (mode === "raw") {
      payload = extractRaw(window.DF_VERSION).trim() || normalized;
    } else if (mode === "app") {
      payload = `App ${normalized}`;
    } else if (mode === "plain") {
      payload = normalized;
    } else if (mode) {
      payload = `${mode.replace(/_/g, " ")} ${normalized}`.trim();
    }

    return `${prefix}${payload}${suffix}`.trim() || payload;
  };

  const applyToSlots = () => {
    const nodes = Array.from(document.querySelectorAll("[data-version-slot], #version"));
    const label = normalize(window.DF_VERSION);
    if (!label) return;
    nodes.forEach((node) => {
      const formatted = formatForNode(node);
      if (formatted) node.textContent = formatted;
    });
  };

  const onVersionEvent = (event) => {
    if (event && event.detail !== undefined) {
      window.DF_VERSION = event.detail;
    }
    applyToSlots();
  };

  window.addEventListener("df-version", onVersionEvent);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyToSlots, { once: true });
  } else {
    applyToSlots();
  }

  window.dispatchEvent(new CustomEvent("df-version", { detail: window.DF_VERSION }));
})();
