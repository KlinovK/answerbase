const WIDGET_SCRIPT = `(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !script.getAttribute("data-chatbot-id")) {
    var candidates = document.querySelectorAll("script[src*='/widget.js'][data-chatbot-id]");
    script = candidates[candidates.length - 1];
  }
  if (!script) return;

  var publicId = script.getAttribute("data-chatbot-id") || "";
  if (!/^bot_[A-Za-z0-9_-]{12}$/.test(publicId)) {
    console.error("Answerbase widget: invalid data-chatbot-id.");
    return;
  }

  var scriptOrigin;
  try {
    scriptOrigin = new URL(script.src, document.baseURI).origin;
  } catch (_error) {
    console.error("Answerbase widget: unable to resolve script origin.");
    return;
  }

  function mountWidget() {
    var rootId = "answerbase-widget-root-" + publicId;
    if (document.getElementById(rootId)) return;

    var root = document.createElement("div");
    root.id = rootId;
    root.style.setProperty("all", "initial", "important");
    root.style.setProperty("position", "fixed", "important");
    root.style.setProperty("inset", "0", "important");
    root.style.setProperty("display", "block", "important");
    root.style.setProperty("visibility", "visible", "important");
    root.style.setProperty("opacity", "1", "important");
    root.style.setProperty("pointer-events", "none", "important");
    root.style.setProperty("z-index", "2147483647", "important");
    var mountTarget = root.attachShadow
      ? root.attachShadow({ mode: "open" })
      : root;

    var panel = document.createElement("div");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Answerbase support chat");
    panel.style.cssText = [
      "position:fixed",
      "right:20px",
      "bottom:88px",
      "width:min(380px,calc(100vw - 32px))",
      "height:min(600px,calc(100vh - 120px))",
      "display:none",
      "overflow:hidden",
      "border:1px solid rgba(15,23,42,.12)",
      "border-radius:16px",
      "background:#fff",
      "box-shadow:0 20px 50px rgba(15,23,42,.2)",
      "pointer-events:auto",
      "z-index:2147483646"
    ].join(";");

    var iframe = document.createElement("iframe");
    iframe.title = "Answerbase support assistant";
    iframe.style.cssText = "width:100%;height:100%;border:0;background:#fff";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("loading", "lazy");
    panel.appendChild(iframe);

    var launcher = document.createElement("button");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open support chat");
    launcher.setAttribute("aria-expanded", "false");
    launcher.textContent = "?";
    launcher.style.cssText = [
      "position:fixed",
      "right:20px",
      "bottom:20px",
      "width:52px",
      "height:52px",
      "border:0",
      "border-radius:9999px",
      "background:#111827",
      "color:#fff",
      "font:600 20px/1 system-ui,-apple-system,sans-serif",
      "cursor:pointer",
      "box-shadow:0 10px 28px rgba(15,23,42,.25)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "visibility:visible",
      "opacity:1",
      "pointer-events:auto",
      "z-index:2147483647"
    ].join(";");

    var open = false;
    launcher.addEventListener("click", function () {
      open = !open;

      if (open && !iframe.src) {
        iframe.src = scriptOrigin + "/embed/" + encodeURIComponent(publicId);
      }

      panel.style.display = open ? "block" : "none";
      launcher.textContent = open ? "×" : "?";
      launcher.setAttribute("aria-label", open ? "Close support chat" : "Open support chat");
      launcher.setAttribute("aria-expanded", String(open));
    });

    mountTarget.appendChild(panel);
    mountTarget.appendChild(launcher);
    document.body.appendChild(root);
  }

  if (document.body) {
    mountWidget();
  } else {
    document.addEventListener("DOMContentLoaded", mountWidget, { once: true });
  }
})();`;

export const dynamic = "force-static";

export function GET() {
  return new Response(WIDGET_SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
