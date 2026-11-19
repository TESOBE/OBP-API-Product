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
  // Real calls with responses shaped as OBP-API returns them (from its resource docs), shortened: long ids end in "…".
  var calls = [
    {
      title: 'Look up an asset, with its decimal places',
      request: 'GET /obp/v7.0.0/assets/OMR',
      response: [
        '{',
        '  "asset_code": "OMR",',
        '  "asset_type": "FIAT",',
        '  "name": "Rial Omani",',
        '  "decimal_places": 3,',
        '  "status": "ACTIVE"',
        '}'
      ]
    },
    {
      title: 'List a customer\'s accounts at every bank',
      request: 'GET /obp/v7.0.0/my/accounts',
      response: [
        '{',
        '  "accounts": [{',
        '    "account_id": "f026fbd3-d1ea-496b…",',
        '    "label": "Everyday account",',
        '    "bank_id": "gh.29.uk",',
        '    "account_routings": [{',
        '      "scheme": "IBAN",',
        '      "address": "DE89370400440532013000"',
        '    }],',
        '    "views": [{ "view_id": "owner" }]',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Read every balance at a bank in one call',
      request: 'GET /obp/v7.0.0/banks/gh.29.uk/balances',
      response: [
        '{',
        '  "accounts": [{',
        '    "account_id": "8ca8a7e4-6d02-40e3…",',
        '    "label": "Everyday account",',
        '    "balances": [{',
        '      "currency": "EUR",',
        '      "amount": "2450.70"',
        '    }]',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Read transactions through the owner view',
      request: 'GET /obp/v7.0.0/banks/gh.29.uk/accounts/8ca8a7e4/owner/transactions',
      response: [
        '{',
        '  "transactions": [{',
        '    "transaction_id": "5f1b7a2c-9e3d-4c8a…",',
        '    "other_account": {',
        '      "holder": { "name": "City Utilities" }',
        '    },',
        '    "details": {',
        '      "type": "SEPA",',
        '      "description": "Electricity",',
        '      "value": {',
        '        "currency": "EUR",',
        '        "amount": "-84.20"',
        '      }',
        '    }',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Pay an IBAN with a SEPA transaction request',
      request: 'POST /obp/v7.0.0/banks/gh.29.uk/accounts/8ca8a7e4/owner/transaction-request-types/SEPA/transaction-requests',
      response: [
        '{',
        '  "id": "4050046c-63b3-4868-8a22…",',
        '  "type": "SEPA",',
        '  "status": "COMPLETED",',
        '  "details": {',
        '    "to_sepa": {',
        '      "iban": "DE91100000000123456789"',
        '    },',
        '    "value": {',
        '      "currency": "EUR",',
        '      "amount": "120.00"',
        '    }',
        '  }',
        '}'
      ]
    },
    {
      title: 'Give an app consent to one account, for an hour',
      request: 'POST /obp/v7.0.0/my/consents/IMPLICIT',
      response: [
        '{',
        '  "consent_id": "9d429899-24f5-42c8…",',
        '  "jwt": "eyJhbGciOiJIUzI1NiJ9.eyJlbnR…",',
        '  "status": "ACCEPTED"',
        '}'
      ]
    },
    {
      title: 'See the consents a customer has given',
      request: 'GET /obp/v7.0.0/my/consents',
      response: [
        '{',
        '  "consents": [{',
        '    "consent_id": "9d429899-24f5-42c8…",',
        '    "consumer_id": "7uy8a7e4-6d02-40e3…",',
        '    "status": "ACCEPTED",',
        '    "last_usage_date": "2026-11-18"',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Ask how long a consent may last',
      request: 'GET /obp/v7.0.0/public/consent-config',
      response: [
        '{',
        '  "consents_allowed": true,',
        '  "max_time_to_live_in_seconds": 7776000,',
        '  "sca_enabled": true',
        '}'
      ]
    },
    {
      title: 'The same accounts, in UK Open Banking',
      request: 'GET /open-banking/v3.1/accounts',
      response: [
        '{',
        '  "Data": {',
        '    "Account": [{',
        '      "AccountId": "8ca8a7e4-6d02-40e3…",',
        '      "Currency": "GBP",',
        '      "AccountType": "Personal",',
        '      "AccountSubType": "CurrentAccount",',
        '      "Nickname": "Everyday account"',
        '    }]',
        '  }',
        '}'
      ]
    },
    {
      title: 'And in Berlin Group',
      request: 'GET /berlin-group/v1.3/accounts',
      response: [
        '{',
        '  "accounts": [{',
        '    "resourceId": "8ca8a7e4-6d02-40e3…",',
        '    "iban": "DE89370400440532013000",',
        '    "currency": "EUR",',
        '    "name": "Everyday account",',
        '    "cashAccountType": "CACC"',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Find ATMs, with their opening hours',
      request: 'GET /obp/v7.0.0/banks/gh.29.uk/atms',
      response: [
        '{',
        '  "atms": [{',
        '    "name": "ATM by the Lake",',
        '    "address": {',
        '      "city": "Berlin",',
        '      "postcode": "13359"',
        '    },',
        '    "monday": {',
        '      "opening_time": "06:00",',
        '      "closing_time": "23:00"',
        '    }',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Convert between currencies',
      request: 'GET /obp/v7.0.0/banks/gh.29.uk/fx/EUR/GBP',
      response: [
        '{',
        '  "from_currency_code": "EUR",',
        '  "to_currency_code": "GBP",',
        '  "conversion_value": 0.8432,',
        '  "inverse_conversion_value": 1.1859,',
        '  "effective_date": "2026-11-19"',
        '}'
      ]
    },
    {
      title: 'Look up a customer, with a Role that allows it',
      request: 'GET /obp/v7.0.0/banks/gh.29.uk/customers/7d2e4c19',
      response: [
        '{',
        '  "customer_id": "7d2e4c19-5b3a-4f8e…",',
        '  "customer_number": "5987953",',
        '  "legal_name": "Kalahari Safari Tours",',
        '  "credit_limit": {',
        '    "currency": "BWP",',
        '    "amount": "50000"',
        '  }',
        '}'
      ]
    },
    {
      title: 'See the Roles you hold',
      request: 'GET /obp/v7.0.0/my/entitlements',
      response: [
        '{',
        '  "list": [{',
        '    "entitlement_id": "6fb17583-1e49…",',
        '    "role_name": "CanGetCustomersAtOneBank",',
        '    "bank_id": "gh.29.uk"',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Add an attribute-based access rule',
      request: 'POST /obp/v7.0.0/management/abac-rules',
      response: [
        '{',
        '  "abac_rule_id": "3c9f1e7a-2b4d-4a6e…",',
        '  "rule_name": "accounts_over_1000",',
        '  "rule_code": "accountOpt.exists(',
        '    _.balance.toDouble > 1000.0)",',
        '  "is_active": true',
        '}'
      ]
    },
    {
      title: 'Create a new API with no code: a dynamic entity',
      request: 'POST /obp/v7.0.0/management/system-dynamic-entities',
      response: [
        '{',
        '  "dynamic_entity_id": "a1b2c3d4-e5f6…",',
        '  "entity_name": "loan_application",',
        '  "has_personal_entity": true,',
        '  "has_public_access": false',
        '}'
      ]
    },
    {
      title: 'Check an app\'s rate limits',
      request: 'GET /obp/v7.0.0/management/consumers/7uy8a7e4/consumer/rate-limits',
      response: [
        '{',
        '  "limits": [{',
        '    "per_second_call_limit": "10",',
        '    "per_minute_call_limit": "300",',
        '    "per_hour_call_limit": "10000",',
        '    "per_day_call_limit": "-1"',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Count calls, users and apps',
      request: 'GET /obp/v7.0.0/management/aggregate-metrics',
      response: [
        '{',
        '  "count": 44241,',
        '  "average_response_time": 65.21,',
        '  "distinct_user_count": 41,',
        '  "distinct_consumer_count": 12,',
        '  "consent_call_count": 1024',
        '}'
      ]
    },
    {
      title: 'See which API Products your apps subscribe to',
      request: 'GET /obp/v7.0.0/my/api-product-subscriptions',
      response: [
        '{',
        '  "api_product_subscriptions": [{',
        '    "api_product_code": "OPEN-DATA-PLUS",',
        '    "consumer_id": "7uy8a7e4-6d02-40e3…",',
        '    "status": "active",',
        '    "start_date": "2026-11-01"',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Read the glossary, as people and AI agents do',
      request: 'GET /obp/v7.0.0/api/glossary',
      response: [
        '{',
        '  "glossary_items": [{',
        '    "title": "Consent",',
        '    "description": {',
        '      "markdown": "Consents provide a',
        '        mechanism through which a resource',
        '        owner (e.g. a customer) can grant a',
        '        third party certain access to their',
        '        resources…"',
        '    }',
        '  }]',
        '}'
      ]
    },
    {
      title: 'List the banks on this instance',
      request: 'GET /obp/v7.0.0/banks',
      response: [
        '{',
        '  "banks": [{',
        '    "bank_id": "gh.29.uk",',
        '    "full_name": "Example Bank",',
        '    "bank_routings": [{',
        '      "scheme": "OBP",',
        '      "address": "gh.29.uk"',
        '    }]',
        '  }]',
        '}'
      ]
    },
    {
      title: 'Check which version is running',
      request: 'GET /obp/v7.0.0/root',
      response: [
        '{',
        '  "version": "v7.0.0",',
        '  "version_status": "BLEEDING_EDGE",',
        '  "connector": "star"',
        '}'
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
