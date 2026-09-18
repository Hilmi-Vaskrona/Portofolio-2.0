# Portofolio 2.0 — Hilmi Zaki R

Personal portfolio website milik **Hilmi Zaki R** — siswa SMK Madinatul Quran jurusan Rekayasa Perangkat Lunak (RPL). Menampilkan profil, pengalaman proyek, portofolio web & desain, sertifikat, dan formulir kontak.

## 🚀 Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | [Astro](https://astro.build) |
| CSS | Tailwind CSS v4 |
| Animasi | [anime.js](https://animejs.com) |
| Smooth Scroll | [Lenis](https://github.com/darkroomengineering/lenis) |
| Font | Inter + JetBrains Mono |
| Form Kontak | Formspree |

## 🎨 Desain

Dark monochrome (hitam/abu/putih), glassmorphism, glow effects, glitch & dissolve loading screen, scanline CRT overlay, scroll reveal animations.

## 📂 Struktur

```text
/
├── public/
│   ├── logo_vaskrona.png
│   ├── favicon.svg
│   └── sertifikat/
├── src
│   ├── components/
│   │   ├── LoadingScreen.astro
│   │   ├── Navbar.astro
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── Experience.astro
│   │   ├── Portfolio.astro
│   │   ├── Sertifikat.astro
│   │   ├── Contact.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
└── package.json
```

## 🧞 Commands

| Command | Aksi |
|---|---|
| `npm run dev` | Mulai dev server di `localhost:4321` |
| `npm run build` | Build production ke `./dist/` |
| `npm run preview` | Preview hasil build |
| `npm run astro check` | Cek error TypeScript |