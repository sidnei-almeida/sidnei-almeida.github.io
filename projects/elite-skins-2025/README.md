<p align="center">
  <strong>Elite Skins 2025 · CS2 Community Platform</strong><br />
  <em>Counter-Strike 2 skin trading community · Group management · Offers · Giveaways · Static responsive frontend.</em>
</p>

<p align="center">
  <a href="https://elite-skins-2025.github.io"><strong>elite-skins-2025.github.io</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/elite-skins-2025/elite-skins-2025.github.io">Source</a>
</p>

<p align="center">
  Maintainer: <a href="https://github.com/sidnei-almeida">@sidnei-almeida</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-HTML5_·_CSS3_·_JS-E34F26?style=flat&logo=html5&logoColor=white" />
  <img alt="Host" src="https://img.shields.io/badge/Host-GitHub_Pages-181717?style=flat&logo=github&logoColor=white" />
</p>

---

## Executive summary

**Elite Skins 2025** is a community platform for Counter-Strike 2 skin trading, built as a multi-section landing page with alternating hero-image and solid-background sections. The site provides group registration, offer listings, giveaway mechanics and an FAQ — all from a pure static frontend hosted on GitHub Pages.

---

## Site structure

| Section | Background | Purpose |
|---------|-----------|---------|
| **Hero** | `bg-hero.jpg` | Brand introduction and primary CTA |
| **Groups & Offers** | Solid | Trading group listings and active skin offers |
| **Why Join** | `bg-porque-participar.jpg` | Value proposition for new members |
| **How It Works** | Solid | Step-by-step onboarding flow |
| **FAQ** | `bg-faq.jpg` | Frequently asked questions |
| **Contact** | Solid | Contact form and social links |
| **Footer** | Hero image (reused) | Navigation and legal |

Background images are located in `./images/backgrounds/` with a 70% opacity overlay and gradient blending to ensure text readability at all contrast levels.

---

## Repository layout

```
elite-skins-2025.github.io/
├── index.html          # Main landing page
├── index.css           # Styles and layout
├── api.html            # CS2 Valuation API landing
├── dashboard.html      # Dashboard view
├── images/
│   └── backgrounds/    # Hero, section and footer backgrounds
└── fonts/              # Custom typeface assets
```

---

## Running locally

```bash
git clone https://github.com/elite-skins-2025/elite-skins-2025.github.io.git
cd elite-skins-2025.github.io
# Open index.html directly in a browser, or serve with:
python -m http.server 8080
```

---

## License

Licensed under the **MIT License**. Free to use, modify and redistribute.
