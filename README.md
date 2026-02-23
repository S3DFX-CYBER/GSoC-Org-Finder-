# 🚀 GSoC 2026 Org Finder

> **Find your perfect Google Summer of Code 2026 organization — filtered by your tech stack, domain, and interests.**

Live site → [https://findmygsoc.vercel.app/](https://findmygsoc.vercel.app/)

---

## ✨ What is this?

A fast, beautiful, single-page tool that helps GSoC 2026 applicants cut through all 185 selected organizations and instantly find the ones that match **their** skills and interests.

No sign-up. No install. Just open and explore.

---

## 🎯 Features

- 🔍 **Search** by org name or any keyword
- 🗂️ **Filter by domain** — Science, Web, Security, AI, OS, Media, and more
- 💻 **Filter by language** — Python, Rust, Go, C++, Java, JavaScript, Haskell, Julia, and more
- 🏷️ **Quick-tap language pills** — select multiple at once for combined matching
- ⭐ **Smart match scoring** — cards ranked as *Great Match* or *Good Match* based on your stack
- 📋 **Detail modal** — click any org to see full description, tech tags, and "Best Fit For" info
- 📱 **Fully responsive** — works great on mobile too

---

## 🗂️ All 185 GSoC 2026 Organizations Included

Covers all domains:

| Domain | Examples |
|---|---|
| Science & Medicine | OpenAstronomy, DeepChem, MDAnalysis, ArduPilot |
| Programming Languages | LLVM, GCC, Haskell.org, Rust Foundation, Swift |
| Data | MariaDB, CNCF, DBpedia, OpenStreetMap |
| Web | Django, Drupal, Wagtail, Wikimedia |
| Security | Metasploit, OWASP, Rizin, AFLplusplus |
| Operating Systems | Debian, FreeBSD, GNOME, NetBSD, Haiku |
| Media | FFmpeg, OpenCV, Synfig, Jitsi |
| Infrastructure | Kubeflow, KubeVirt, QEMU, Meshery |
| AI | JAX & Keras, German Center for Open Source AI |
| Dev Tools | MIT App Inventor, OpenVINO, Gemini CLI, API Dash |

---

## 🛠️ How to Use


### Option  — Open locally

```bash
git clone https://github.com/your-username/gsoc-2026-org-finder.git
cd gsoc-2026-org-finder
open index.html   # macOS
# or just drag index.html into your browser
```



## 📁 Project Structure

```
gsoc-2026-org-finder/
├── index.html      # The entire app — one self-contained file
└── README.md       # You're reading it
```

No build step. No dependencies. No node_modules. Just one HTML file.

---

## 🤝 Contributing

Found a missing org, wrong category, or incorrect tags? PRs welcome!

1. Fork the repo
2. Edit the `ORGS` array in `index.html`
3. Open a pull request

Each org entry looks like this:

```js
{
  name: "Organization Name",
  cat: "science",          // science | programming | data | web | os | security | media | infra | ai | dev | other
  tags: ["python", "c++", "machine learning"],
  desc: "Short description of what the org does.",
  fit: ["Python devs", "ML researchers", "Scientific computing"]
}
```

---

## 📅 GSoC 2026 Key Dates

| Date | Milestone |
|---|---|
| Feb 2026 | Organizations announced |
| **Mar 16, 2026** | **Student applications open** |
| Apr 2026 | Application deadline |
| May 2026 | Accepted students announced |
| Jun–Sep 2026 | Coding period |

---

## 💬 Share It

Found this useful? Share it with your community!

Applications open Mar 16. Share with anyone applying! 🙌
```

---

## 📄 License

Apache 2.0

---

<p align="center">Made with ❤️ for the GSoC 2026 applicant community</p>
<p align="center">Data sourced from <a href="https://summerofcode.withgoogle.com/programs/2026/organizations">summerofcode.withgoogle.com</a></p>
