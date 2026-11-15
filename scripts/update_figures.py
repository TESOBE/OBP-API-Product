"""
Reads public figures from an OBP-API instance and writes them to docs/figures.json, which the site
shows. Browsers cannot read OBP-API from another site (it sends CORS headers only on the preflight),
so the figures are fetched here, by a scheduled GitHub Action, and served next to the pages.

Usage: python3 scripts/update_figures.py [BASE_URL]
"""

import collections
import datetime
import json
import pathlib
import sys
import urllib.request

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "https://apisandbox.openbankproject.com").rstrip("/")
OUTPUT = pathlib.Path(__file__).resolve().parent.parent / "docs" / "figures.json"

# The site's capability areas, each made of OBP API tags
AREAS = {
    "Accounts": ["Account", "Account-Access", "Account-Access-Request", "Account-Application", "Account-Attribute", "Account-Metadata", "Account-Public", "Balance"],
    "Payments": ["Transaction-Request", "Transaction-Request-Attribute", "Transaction", "Transaction-Attribute", "Transaction-Metadata", "Counterparty", "Counterparty-Attribute", "Counterparty-Limits", "Counterparty-Metadata", "Payee", "Standing-Order", "Direct-Debit", "VRP", "FX"],
    "Customers and KYC": ["Customer", "Customer-Attribute", "Corporate-Customer", "Retail-Customer", "Customer-Meeting", "Customer-Message", "KYC", "Onboarding"],
    "Consents and mandates": ["Consent", "Mandate"],
    "Cards and products": ["Card", "Card-Attribute", "Product", "Product-Attribute", "Product-Collection", "Api-Product", "Api-Product-Subscription"],
    "Dynamic APIs": ["Dynamic", "Dynamic-Entity", "Dynamic-Entity-Manage", "Personal-Dynamic-Entity", "Dynamic-Endpoint-Manage", "Dynamic-Resource-Doc", "Dynamic-Message-Doc", "Dynamic-Change-Request", "Endpoint-Mapping", "Method-Routing", "Connector-Method", "Webhook"],
    "Access control": ["Role", "Entitlement", "Scope", "Group", "View-Custom", "View-System", "ABAC", "Consumer", "OAuth", "OIDC", "Rate-Limits"],
    "Files, assets and retention": ["File", "Asset", "Data-Retention"],
    "Operations": ["Metric", "Aggregate-Metrics", "Log-Cache", "Cache", "System", "System-Integrity", "WebUi-Props", "Tenant"],
    "Branches and ATMs": ["Branch", "ATM", "ATM-Attribute"],
}


def get_json(path):
    request = urllib.request.Request(BASE_URL + path, headers={"Accept": "application/json", "User-Agent": "obp-product-site-figures"})
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.load(response)


def main():
    root = get_json("/obp/v7.0.0/root")
    versions = get_json("/obp/v6.0.0/api/versions")["scanned_api_versions"]
    resource_docs = get_json("/obp/v7.0.0/resource-docs/v7.0.0/obp?content=static")["resource_docs"]
    glossary = get_json("/obp/v4.0.0/api/glossary").get("glossary_items", [])
    banks = get_json("/obp/v5.1.0/banks").get("banks", [])

    tag_counts = collections.Counter(tag for doc in resource_docs for tag in doc.get("tags", []))
    roles = {role["role"] for doc in resource_docs for role in (doc.get("roles") or [])}

    obp_versions = [v["api_short_version"] for v in versions if v["api_standard"] == "obp" and v["api_short_version"].startswith("v")]
    standards = collections.defaultdict(list)
    for version in versions:
        if version["api_standard"] != "obp":
            standards[version["api_standard"]].append(version["api_short_version"])

    figures = {
        "source": BASE_URL,
        "fetched_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "latest_version": root.get("version"),
        "latest_version_status": root.get("version_status"),
        "endpoints": len(resource_docs),
        "roles": len(roles),
        "tags": len(tag_counts),
        "glossary_items": len(glossary),
        "obp_versions": obp_versions,
        "standards": dict(standards),
        "sandbox_banks": len(banks),
        "areas": {area: sum(tag_counts.get(tag, 0) for tag in tags) for area, tags in AREAS.items()},
    }
    OUTPUT.write_text(json.dumps(figures, indent=2) + "\n")
    print(json.dumps(figures, indent=2))


if __name__ == "__main__":
    main()
