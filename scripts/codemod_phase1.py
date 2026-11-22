#!/usr/bin/env python3
import os
import re

TARGET_FILES = [
    "src/pages/store/CatalogPage.jsx",
    "src/pages/store/CatalogPage.module.css",
    "src/pages/store/ProductDetailPage.jsx",
    "src/pages/store/ProductDetailPage.module.css",
    "src/pages/store/CartPage.jsx",
    "src/pages/store/CartPage.module.css",
    "src/pages/store/CheckoutPage.jsx",
    "src/pages/store/CheckoutPage.module.css",
    "src/pages/store/OrdersPage.jsx",
    "src/pages/store/OrdersPage.module.css",
    "src/pages/store/OrderDetailPage.jsx",
    "src/pages/store/OrderDetailPage.module.css",
    "src/pages/store/AccountPage.jsx",
    "src/pages/store/AccountPage.module.css",
]

HEX_MAP = [
    (r"var\(--wex-navy,\s*#061A55\)", "var(--wex-navy)"),
    (r"var\(--wex-royal,\s*#0B3FBF\)", "var(--wex-royal)"),
    (r"var\(--wex-vivid,\s*#1E6BFF\)", "var(--wex-vivid)"),
    (r"var\(--wex-cyan,\s*#00B7FF\)", "var(--wex-cyan)"),
    (r"var\(--wex-ice,\s*#EAF3FF\)", "var(--wex-ice)"),
    (r"var\(--wex-ice-light,\s*#F4F8FE\)", "var(--wex-ice-light)"),
    (r"var\(--wex-border,\s*#D5E2F7\)", "var(--wex-border)"),
    (r"var\(--wex-text-secondary,\s*#4B5B85\)", "var(--wex-text-secondary)"),
    (r"var\(--wex-disabled,\s*#9AA8C7\)", "var(--wex-disabled)"),
    (r"var\(--wex-gray-100,\s*#EAF3FF\)", "var(--wex-ice)"),
    (r"var\(--wex-gray-100,\s*#F4F8FE\)", "var(--wex-ice-light)"),
    (r"var\(--wex-gray-200,\s*#D5E2F7\)", "var(--wex-border)"),
    (r"var\(--wex-gray-300,\s*#D5E2F7\)", "var(--wex-border)"),
    (r"var\(--wex-gray-400,\s*#4B5B85\)", "var(--wex-text-secondary)"),
    (r"var\(--wex-gray-600,\s*#4B5B85\)", "var(--wex-text-secondary)"),
    (r"var\(--wex-gray-800,\s*#061A55\)", "var(--wex-navy)"),
    (r"var\(--wex-radius-full,\s*9999px\)", "var(--radius-pill)"),
    (r"var\(--radius-full,\s*9999px\)", "var(--radius-pill)"),
    (r"var\(--radius-md,\s*12px\)", "var(--radius-control)"),
    (r"var\(--wex-radius-md,\s*12px\)", "var(--radius-control)"),
    (r"var\(--radius-md,\s*14px\)", "var(--radius-control)"),
    (r"var\(--radius-lg,\s*20px\)", "var(--radius-card)"),
    (r"var\(--radius-xl,\s*28px\)", "var(--radius-panel)"),
    (r"var\(--radius-card-v2,\s*22px\)", "var(--radius-card)"),
    (r"var\(--radius-panel-v2,\s*26px\)", "var(--radius-panel)"),
    (r"var\(--radius-bar-v2,\s*28px\)", "var(--radius-panel)"),
    (r"var\(--radius-header-v2,\s*32px\)", "var(--radius-panel)"),
]

COLOR_MAP = [
    (r"#061[aA]55", "var(--wex-navy)"),
    (r"#0[bB]3[fF][bB][fF]", "var(--wex-royal)"),
    (r"#1[eE]6[bB][fF]{2}", "var(--wex-vivid)"),
    (r"#00[bB]7[fF]{2}", "var(--wex-cyan)"),
    (r"#[eE][aA][fF]3[fF]{2}", "var(--wex-ice)"),
    (r"#[fF]4[fF]8[fF][eE]", "var(--wex-ice-light)"),
    (r"#[dD]5[eE]2[fF]7", "var(--wex-border)"),
    (r"#4[bB]5[bB]85", "var(--wex-text-secondary)"),
    (r"#9[aA]{2}8[cC]7", "var(--wex-disabled)"),
    (r"#12805[cC]", "var(--wex-success)"),
    (r"#[bB]45309", "var(--wex-warning)"),
    (r"#[bB]42318", "var(--wex-danger)"),
    (r"#[eE]8[fF]5[eE]{2}", "var(--wex-success-bg)"),
    (r"#[fF][eE][fF]3[eE]2", "var(--wex-warning-bg)"),
    (r"#[fF][eE]{2}8[eE]7", "var(--wex-danger-bg)"),
]

def replace_in_css(content):
    # Hex aliases with fallback
    for pat, repl in HEX_MAP:
        content = re.sub(pat, repl, content)

    # Standalone colors
    for pat, repl in COLOR_MAP:
        content = re.sub(pat, repl, content)

    # #FFFFFF and #fff (when used as color or background, not inside linear-gradient rgba or url)
    content = re.sub(r":\s*#([fF]{3}|[fF]{6})\s*;", r": var(--wex-white);", content)
    content = re.sub(r":\s*#([fF]{3}|[fF]{6})\s*!important;", r": var(--wex-white) !important;", content)
    content = re.sub(r"solid\s*#([fF]{3}|[fF]{6})\b", r"solid var(--wex-white)", content)

    # Radii collapsing into 4 named steps: control (12), card (20), panel (28), pill (999)
    # 8px -> keep or sm
    # 10px, 12px, 14px, 15px -> var(--radius-control)
    # 16px, 18px, 20px, 22px, 24px -> var(--radius-card)
    # 26px, 28px, 30px, 32px -> var(--radius-panel)
    # 999px, 9999px, 50% (for non-circles) -> var(--radius-pill)
    content = re.sub(r"border-radius:\s*(10|12|14|15)px;", r"border-radius: var(--radius-control);", content)
    content = re.sub(r"border-radius:\s*(16|18|20|22|24)px;", r"border-radius: var(--radius-card);", content)
    content = re.sub(r"border-radius:\s*(26|28|30|32)px;", r"border-radius: var(--radius-panel);", content)
    content = re.sub(r"border-radius:\s*(999|9999)px;", r"border-radius: var(--radius-pill);", content)

    # Corner radii: e.g. 0 0 24px 24px or 0 0 28px 28px or 0 0 32px 32px
    content = re.sub(r"border-radius:\s*0\s+0\s+(24|26|28|30|32)px\s+(24|26|28|30|32)px;", r"border-radius: 0 0 var(--radius-panel) var(--radius-panel);", content)
    content = re.sub(r"border-radius:\s*(24|26|28|30|32)px\s+(24|26|28|30|32)px\s+0\s+0;", r"border-radius: var(--radius-panel) var(--radius-panel) 0 0;", content)

    # 100vh -> 100dvh
    content = re.sub(r"min-height:\s*100vh;\s*\n(\s*)(?!min-height:\s*100dvh;)", r"min-height: 100vh;\n\1min-height: 100dvh;\n\1", content)

    return content

def replace_in_jsx(content):
    # Hex in JSX
    for pat, repl in COLOR_MAP:
        content = re.sub(pat, repl, content)
    return content

for path in TARGET_FILES:
    if not os.path.exists(path):
        continue
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()
    if path.endswith(".css"):
        updated = replace_in_css(original)
    else:
        updated = replace_in_jsx(original)
    if updated != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(updated)
        print(f"Updated: {path}")

print("Codemod completed.")
