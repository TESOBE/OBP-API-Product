// OBP-API product site: scroll reveal, figures from figures.json, and the demo terminal.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Scroll reveal ----
  var revealed = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("seen");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealed.forEach(function (element) { revealObserver.observe(element); });
  } else {
    revealed.forEach(function (element) { element.classList.add("seen"); });
  }

  // ---- Figures ----
  function formatNumber(value) {
    return Number(value).toLocaleString("en-GB");
  }

  function countUp(element, target) {
    if (reduceMotion) { element.textContent = formatNumber(target); return; }
    var started = null;
    var duration = 1400;
    function step(time) {
      if (started === null) started = time;
      var progress = Math.min((time - started) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatNumber(Math.round(target * eased));
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function whenVisible(element, action) {
    if (!("IntersectionObserver" in window)) { action(); return; }
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { observer.disconnect(); action(); }
    }, { threshold: 0.3 });
    observer.observe(element);
  }

  function valueOf(figures, name) {
    if (name === "obp_versions") return (figures.obp_versions || []).length;
    if (name === "standards") {
      var standards = figures.standards || {};
      // the Open Bank Project's own API counts as one of the standards
      return Object.keys(standards).length + 1;
    }
    return figures[name];
  }

  function showFigures(figures) {
    document.querySelectorAll("[data-figure]").forEach(function (element) {
      var value = valueOf(figures, element.getAttribute("data-figure"));
      if (typeof value !== "number") return;
      whenVisible(element, function () { countUp(element, value); });
    });

    document.querySelectorAll("[data-text]").forEach(function (element) {
      var value = figures[element.getAttribute("data-text")];
      if (typeof value === "string" && value) element.textContent = value;
    });

    document.querySelectorAll("[data-fetched]").forEach(function (element) {
      if (!figures.fetched_at) return;
      var date = new Date(figures.fetched_at);
      element.textContent = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    });

    var bars = document.querySelector("[data-bars]");
    if (bars && figures.areas) {
      var areas = Object.keys(figures.areas).map(function (name) { return [name, figures.areas[name]]; })
        .sort(function (first, second) { return second[1] - first[1]; });
      var largest = areas.length ? areas[0][1] : 1;
      bars.innerHTML = "";
      areas.forEach(function (area) {
        var item = document.createElement("li");
        var label = document.createElement("span");
        label.className = "label";
        label.textContent = area[0];
        var track = document.createElement("span");
        track.className = "track";
        var fill = document.createElement("span");
        fill.className = "fill";
        fill.setAttribute("data-width", String(Math.max(4, Math.round((area[1] / largest) * 100))));
        track.appendChild(fill);
        var count = document.createElement("span");
        count.className = "count";
        count.textContent = formatNumber(area[1]);
        item.appendChild(label);
        item.appendChild(track);
        item.appendChild(count);
        bars.appendChild(item);
      });
      whenVisible(bars, function () {
        bars.querySelectorAll(".fill").forEach(function (fill) { fill.style.width = fill.getAttribute("data-width") + "%"; });
      });
    }
  }

  if (document.querySelector("[data-figure], [data-bars], [data-fetched], [data-text]")) {
    fetch("figures.json", { cache: "no-cache" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (figures) { if (figures) showFigures(figures); })
      .catch(function () { /* the pages read well without the figures */ });
  }

  // ---- Demo terminal ----
  // Real calls with responses as OBP-API v7.0.0 returns them, shortened.
  var calls = [
    {
      title: "Look up an asset, with its decimal places",
      request: "GET /obp/v7.0.0/assets/OMR",
      response: [
        "{",
        '  "asset_code": "OMR",',
        '  "asset_type": "FIAT",',
        '  "name": "Rial Omani",',
        '  "decimal_places": 3,',
        '  "status": "ACTIVE"',
        "}"
      ]
    },
    {
      title: "List the banks on this instance",
      request: "GET /obp/v7.0.0/banks",
      response: [
        "{",
        '  "banks": [{',
        '    "bank_id": "gh.29.uk",',
        '    "full_name": "Example Bank",',
        '    "bank_routings": [{ "scheme": "OBP", "address": "gh.29.uk" }]',
        "  }]",
        "}"
      ]
    },
    {
      title: "Ask how long a consent may last",
      request: "GET /obp/v7.0.0/public/consent-config",
      response: [
        "{",
        '  "consents_allowed": true,',
        '  "max_time_to_live_in_seconds": 7776000,',
        '  "sca_enabled": true',
        "}"
      ]
    },
    {
      title: "Check which version is running",
      request: "GET /obp/v7.0.0/root",
      response: [
        "{",
        '  "version": "v7.0.0",',
        '  "version_status": "BLEEDING_EDGE",',
        '  "connector": "star"',
        "}"
      ]
    }
  ];

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightJson(line) {
    return escapeHtml(line)
      .replace(/("[^"]*")(\s*:)/g, '<span class="key">$1</span>$2')
      .replace(/:\s*("[^"]*")/g, ': <span class="str">$1</span>')
      .replace(/:\s*(-?\d+(\.\d+)?|true|false|null)/g, ': <span class="num">$1</span>');
  }

  function highlightRequest(request) {
    var space = request.indexOf(" ");
    return '<span class="verb">' + escapeHtml(request.slice(0, space)) + "</span> " +
      '<span class="path">' + escapeHtml(request.slice(space + 1)) + "</span>";
  }

  var terminal = document.querySelector("[data-terminal]");
  if (terminal) {
    var output = terminal.querySelector("pre");
    var caption = terminal.querySelector(".bar span");

    var renderStatic = function (call) {
      caption.textContent = call.title;
      output.innerHTML = '<span class="dim">$ </span>' + highlightRequest(call.request) + "\n\n" +
        call.response.map(highlightJson).join("\n");
    };

    if (reduceMotion) {
      renderStatic(calls[0]);
    } else {
      var callIndex = 0;
      var playCall = function () {
        var call = calls[callIndex];
        caption.textContent = call.title;
        var typed = 0;
        var typeRequest = function () {
          output.innerHTML = '<span class="dim">$ </span>' + escapeHtml(call.request.slice(0, typed)) + '<span class="cursor"></span>';
          if (typed < call.request.length) {
            typed += 1;
            window.setTimeout(typeRequest, 34);
          } else {
            window.setTimeout(showResponse, 380);
          }
        };
        var shownLines = 0;
        var showResponse = function () {
          shownLines += 1;
          output.innerHTML = '<span class="dim">$ </span>' + highlightRequest(call.request) + "\n\n" +
            call.response.slice(0, shownLines).map(highlightJson).join("\n");
          if (shownLines < call.response.length) {
            window.setTimeout(showResponse, 70);
          } else {
            callIndex = (callIndex + 1) % calls.length;
            window.setTimeout(playCall, 3600);
          }
        };
        typeRequest();
      };
      playCall();
    }
  }
})();
