# Portofolio 2.0 — Hilmi Zaki R

## Overview

Personal portfolio website milik **Hilmi Zaki R**, siswa SMK (16 tahun) jurusan Rekayasa Perangkat Lunak (RPL) di SMK Madinatul Quran, Karawang, Jawa Barat. Portfolio ini menampilkan profil diri, pengalaman proyek, portofolio desain & web development, sertifikat, serta formulir kontak.

**Tujuan:** Menampilkan karya dan kemampuan di bidang web development, UI/UX design, dan software engineering.

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | Astro 7 |
| CSS | Tailwind CSS v4 |
| Animasi | anime.js v4 |
| Smooth Scroll | Lenis |
| Font | Inter (sans-serif) + JetBrains Mono (monospace) |
| Bahasa | TypeScript |
| Form Kontak | Formspree |

---

## Design System

### Warna (Monochrome Palette)

| Token | Hex | Keterangan |
|---|---|---|
| Background Utama | `#0a0a0a` | Hitam hampir murni |
| Background Alt | `#111111` | Hitam sedikit lebih terang |
| Card Background | `#1a1a1a` | Abu sangat gelap untuk kartu |
| Accent / Muted | `#a3a3a3` | Abu-abu medium — warna aksen utama |
| Accent Hover | `#d4d4d4` | Abu terang untuk hover state |
| Text Utama | `#e5e5e5` | Putih keabuan |
| Text Dim | `#525252` | Abu gelap untuk teks sekunder |
| Border | `#262626` | Abu sangat gelap untuk garis tepi |
| Glow Effect | `#a3a3a366` | Abu transparan untuk efek glow/shadow |

**Catatan:** Tidak ada warna aksen berwarna (merah, biru, dsb). Seluruh desain monokrom — hanya hitam, abu-abu, dan putih.

### Font

- **Inter** — weights 300–900, digunakan untuk body text dan heading
- **JetBrains Mono** — weights 400, 500, 700, digunakan untuk label teknis dan kode
- **Fallback:** system-ui, -apple-system, sans-serif

### Gaya Desain

1. **Dark Mode** — background gelap (`#0a0a0a`) sebagai default
2. **Glassmorphism** — navbar dan elemen transparan dengan `backdrop-blur-xl` dan opacity rendah
3. **Glow Effects** — bayangan bercahaya abu-abu pada kartu, heading, dan elemen interaktif
4. **Minimalis** — desain bersih, banyak ruang putih (hitam), tipografi jelas
5. **Scanline Overlay** — efek CRT halus (repeating linear gradient) untuk nuansa retro/cyberpunk
6. **Scroll Reveal** — elemen muncul dengan animasi fade-in-up saat di-scroll

---

## Visual Identity & Branding

### Nama & Inisial

- **Nama tampil:** "Hilmi." (dengan titik abu-abu sebagai aksen)
- **Nama lengkap:** Hilmi Zaki R
- **Inisial/Logo mark:** Huruf besar **"H"** — ditampilkan besar di loading screen dan sebagai placeholder profil
- **Favicon:** Saat ini masih default Astro rocket (belum dikustomisasi)

### Elemen Visual Khas

- **Huruf "H" glowing** — inisial ditampilkan besar dengan efek glow abu-abu
- **Titik (.) aksen** — period setelah "Hilmi" selalu berwarna abu (`#a3a3a3`)
- **Glitch effect** — teks loading screen mengalami chromatic aberration (RGB split) sebelum transisi
- **Grid dissolve** — transisi loading screen berakhir dengan efek kotak-kotak yang menyebar
- **Parallax orbs** — gradient blur bulat bergerak parallax di background Hero section
- **Grid lines** — garis grid transparan (3% opacity) sebagai overlay dekoratif

---

## Mood & Aesthetic

Portfolio ini memiliki vibe **dark cyberpunk-adjacent monochrome** — estetika developer/hacker yang minimalis namun tetap profesional.

- **Mood:** Profesional, technical, modern, sedikit edgy
- **Inspirasi:** Terminal UI, hacker aesthetic, monochrome design systems
- **Target audience:** Rekruter, klien potensial, komunitas developer
- **Kesan:** Developer muda yang serius dengan craft-nya, attention to detail pada micro-interactions

---

## Sections / Halaman

Portfolio ini single-page application (SPA) dengan sections berikut:

1. **Loading Screen** — Logo "H." + progress bar + glitch effect + grid dissolve
2. **Navbar** — Fixed glassmorphism header, 6 links (Home, About, Experience, Portfolio, Sertifikat, Contact)
3. **Hero** — Full-screen intro, typing animation ("Software Engineer", "UI/UX Designer", "Frontend Developer", "Creative Thinker"), social media links, profile photo placeholder
4. **About** — Bio singkat, quote, bidang keahlian
5. **Experience** — Timeline vertikal dengan 5 proyek pengalaman
6. **Portfolio** — 6 kartu proyek dengan filter (Web Dev / Design)
7. **Sertifikat** — 5 kartu sertifikat dengan modal zoom & download
8. **Contact** — Info kontak + Formspree form
9. **Footer** — Brand "Hilmi.", social links, copyright

---

## Logo Brief (untuk AI Image Generation)

### Konsep

Logo harus mencerminkan identitas visual portfolio ini: **dark, monochrome, minimalis, techy, dan modern**.

### Spesifikasi Logo

- **Elemen utama:** Huruf **"H"** sebagai logo mark
- **Gaya:** Geometris, clean, modern — terinspirasi dari tipografi monospace (JetBrains Mono) atau sans-serif tajam
- **Warna:** Monokrom — hanya hitam (`#0a0a0a`), abu-abu (`#a3a3a3`), dan putih (`#e5e5e5`). Tidak ada warna lain.
- **Efek:** Glow/shadow tipis berwarna abu-abu (`#a3a3a3`) di sekitar huruf
- **Aksen:** Titik (.) setelah "H" — bisa diintegrasikan sebagai bagian desain (misalnya titik yang glow atau berbentuk diamond)
- **Background:** Gelap (`#0a0a0a` atau `#111111`) agar logo kontras dan terlihat
- **Bentuk:** Bisa berupa ikon persegi/square (seperti app icon) atau bentuk bebas (mark saja tanpa box)

### Referensi Mood

- Efek glow seperti neon abu-abu yang redup
- Nuansa cyberpunk/terminal tapi tetap elegan dan tidak berlebihan
- Mirip aesthetic logo-brand tech startup yang modern dan minimalis
- Huruf "H" bisa memiliki detail teknis seperti garis potong, glitch fragment, atau gradient subtle dari gelap ke terang

### Yang HARUS ADA

- Huruf "H" yang jelas dan mudah dikenali
- Warna monokrom (hitam/abu/putih saja)
- Efek glow atau cahaya tipis abu-abu

### Yang HARUS DIIKUTI

- **Tidak** menggunakan warna selain grayscale
- **Tidak** menggunakan style kartun, 3D render realistis, atau ilustrasi rumit
- **Tidak** menggunakan gradient berwarna (hanya grayscale gradient)
