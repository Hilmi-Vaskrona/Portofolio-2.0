# PRD — Roblox Avatar 3D Interactive untuk Website

**Versi:** 1.0  
**Tanggal:** 6 November 2026  
**Nama project:** Roblox Avatar Interactive — Vaskrona  
**Target implementasi:** AI coding agent (Argon)  
**Status:** Draft implementasi

---

## 1. Ringkasan Project

Project ini bertujuan menampilkan avatar Roblox milik pengguna dengan username **Vaskrona** sebagai karakter 3D interaktif di website. Avatar ditampilkan menggunakan WebGL/Three.js dan dapat berinteraksi dengan pengunjung melalui mouse, klik, drag, zoom, animasi idle, serta animasi tambahan seperti wave apabila model menyediakan rig dan animasi yang kompatibel.

Implementasi harus dibuat sebagai fitur website yang siap dikembangkan lebih lanjut, bukan sekadar demo statis.

**Prioritas utama:** tampilkan model avatar 3D dengan stabil, responsif, dan interaktif. Jangan menganggap model GLB atau animasi sudah tersedia sebelum memeriksa file project.

## 2. Tujuan

- Menampilkan avatar 3D Roblox Vaskrona di website.
- Menambahkan interaksi mouse dan klik.
- Menyediakan kontrol rotasi dan zoom yang nyaman.
- Menambahkan animasi idle procedural.
- Memutar animasi skeletal (misalnya wave) hanya jika tersedia dan kompatibel.
- Menyediakan loading, error, dan fallback state.
- Menjaga performa dan tampilan pada desktop serta mobile.

## 3. Pengguna dan Use Case

Pengunjung website dapat:
1. Melihat avatar 3D.
2. Menggerakkan pointer untuk membuat avatar menoleh/berputar ringan.
3. Drag untuk memutar avatar.
4. Zoom in/out dengan batas jarak.
5. Klik avatar untuk memicu reaksi dan pesan.
6. Melihat animasi idle.
7. Menggunakan website dari layar desktop maupun mobile.

Pemilik project/developer dapat:
1. Menaruh atau mengganti file model avatar.
2. Mengatur skala, posisi, kamera, dan kualitas render melalui konfigurasi.
3. Menambahkan animasi GLB di kemudian hari.

## 4. Scope

### In Scope
- React + Vite (gunakan stack project yang sudah ada bila berbeda; jangan migrasi tanpa alasan).
- Three.js melalui React Three Fiber.
- Drei untuk helper seperti GLTF loader, OrbitControls, Environment, dan useAnimations.
- Model avatar GLB lokal.
- Idle motion procedural yang halus.
- Pointer tracking yang dibatasi agar tidak berlebihan.
- Click reaction dan teks/bubble pesan.
- Orbit/drag dan zoom.
- Responsive layout.
- Loading indicator, error state, dan fallback visual.
- Dokumentasi setup, penempatan model, dan cara menjalankan project.

### Out of Scope
- Membuat atau mengubah item/avatar Roblox di Roblox game.
- Login Roblox atau mengumpulkan credential/cookie pengguna.
- Menyimpan data pengunjung atau melakukan tracking.
- Menjamin seluruh aksesori Roblox/layered clothing dapat diekspor sempurna.
- Membuat animasi skeletal wave dari nol tanpa rig/animasi sumber.
- Mengambil data avatar melalui endpoint tidak resmi yang membutuhkan secret/cookie di frontend.

## 5. Stack dan Dependency

### Wajib
- React
- Vite (jika project belum menggunakan framework lain)
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### Opsional sesuai kebutuhan
- `@react-spring/three` atau GSAP untuk animasi tambahan. Jangan install keduanya tanpa kebutuhan.
- `lucide-react` hanya jika UI project memang menggunakannya.

### Instruksi instalasi
Periksa `package.json` lebih dahulu. Jangan menginstal ulang atau mengubah versi dependency yang sudah kompatibel.

Untuk project React + Vite baru:
```bash
npm create vite@latest roblox-avatar-web -- --template react
cd roblox-avatar-web
npm install
npm install three @react-three/fiber @react-three/drei
```

Untuk project yang sudah ada, tambahkan dependency yang belum terpasang:
```bash
npm install three @react-three/fiber @react-three/drei
```

## 6. Asset Model Avatar

### File yang diharapkan
- Model utama: `public/models/vaskrona.glb`
- Format yang disarankan: GLB (binary glTF).
- Model harus berasal dari avatar milik pengguna atau aset yang pengguna memiliki izin untuk menggunakannya.

### Ketentuan
- Jangan mengarang path file atau menganggap model telah tersedia.
- Periksa isi `public/models/` terlebih dahulu.
- Jika file tidak tersedia, buat loading/error/fallback yang informatif dan jelaskan langkah penempatan model.
- Jangan menampilkan error console berulang.
- Jangan memasukkan Roblox cookie, token, API key, atau credential ke client-side code.
- Jika implementasi API avatar diperlukan, gunakan backend/proxy yang aman dan dokumentasikan batasan autentikasi/izin. Jangan menjanjikan bahwa username saja selalu cukup untuk memperoleh GLB.

### Penempatan
```text
public/
└── models/
    └── vaskrona.glb
```

## 7. Fitur Fungsional

### FR-01 — Render model
- Muat `vaskrona.glb` dengan GLTF loader.
- Model muncul di area avatar tanpa terpotong.
- Terapkan konfigurasi skala dan posisi yang dapat disesuaikan.
- Periksa bounding box model agar framing kamera sesuai.

### FR-02 — Loading dan error
- Tampilkan loading state saat model sedang dimuat.
- Jika file tidak ditemukan atau gagal diproses, tampilkan pesan yang jelas dan fallback UI.
- Jangan blank screen jika model gagal dimuat.

### FR-03 — Idle animation
- Tambahkan gerakan ringan seperti naik-turun dan/atau sway.
- Animasi harus halus, tidak membuat avatar bergerak berlebihan.
- Gunakan delta time atau pendekatan frame-rate independent.

### FR-04 — Pointer tracking
- Avatar menoleh atau berputar ringan mengikuti pointer.
- Batasi sudut rotasi agar tidak berputar liar.
- Kembalikan avatar ke posisi netral saat pointer keluar dari area.
- Jangan mengganggu kontrol drag.

### FR-05 — Drag/orbit
- Pengunjung dapat drag untuk memutar avatar.
- Nonaktifkan pan.
- Batasi vertical angle agar model tidak terbalik.
- Gunakan kontrol yang nyaman di desktop dan touch device.

### FR-06 — Zoom
- Zoom dapat dilakukan dengan scroll/touch control.
- Tetapkan jarak minimum dan maksimum.
- Jangan biarkan kamera masuk ke dalam model atau menjauh berlebihan.

### FR-07 — Click reaction
- Klik avatar memicu reaksi visual ringan.
- Tampilkan bubble/dialog singkat, misalnya: “Hey! Nice to meet you!”
- Hindari menjalankan banyak timer/animasi bersamaan; bersihkan timer jika komponen unmount.
- Reaksi tetap berjalan walaupun animasi wave tidak tersedia.

### FR-08 — Skeletal animation (opsional berdasarkan asset)
- Periksa `model.animations` sebelum mencoba memutar animasi.
- Jika ada clip dengan nama yang mengandung `wave`, putar clip tersebut ketika avatar diklik.
- Jika tidak ada clip wave, jangan menganggap wave berhasil. Gunakan click reaction sebagai fallback.
- Jangan membuat klaim animasi tangan bergerak jika model tidak mempunyai rig/clip yang sesuai.

### FR-09 — Responsive
- Desktop: avatar dapat tampil di samping konten/hero.
- Mobile: layout satu kolom, canvas memiliki tinggi yang memadai.
- Pastikan canvas tidak menutupi tombol atau teks.
- Hormati `prefers-reduced-motion` untuk mengurangi gerakan otomatis.

### FR-10 — Accessibility dan usability
- Tambahkan label/instruksi singkat: drag untuk memutar, scroll untuk zoom, klik untuk reaksi.
- Sediakan teks alternatif atau deskripsi yang relevan untuk area avatar.
- Pastikan kontras teks cukup.
- Interaksi utama tidak boleh bergantung hanya pada hover.

## 8. UI/UX

Gaya default:
- Dark theme.
- Latar belakang gelap dengan aksen ungu atau warna yang sesuai dengan desain project yang sudah ada.
- Area avatar 3D menjadi fokus visual.
- Judul dapat menggunakan “Hi, I’m Vaskrona”.
- Tampilkan bubble pesan ketika avatar diklik.
- Hindari mengubah branding, layout, atau warna halaman lain di project existing.

Jika project telah memiliki design system, ikuti design system tersebut daripada membuat tema baru.

## 9. Struktur File yang Disarankan

Sesuaikan dengan struktur project yang ada; jangan memaksakan struktur baru jika tidak diperlukan.

```text
src/
├── components/
│   └── avatar/
│       ├── AvatarCanvas.jsx
│       ├── AvatarModel.jsx
│       ├── AvatarControls.jsx
│       └── AvatarFallback.jsx
├── pages/ atau app/
│   └── halaman yang menampilkan avatar
├── styles/
│   └── avatar.css
└── ...
public/
└── models/
    └── vaskrona.glb
```

Tanggung jawab:
- `AvatarCanvas`: setup Canvas, lighting, camera, environment.
- `AvatarModel`: load GLB, idle motion, pointer response, click reaction, animation clips.
- `AvatarControls`: orbit/zoom configuration jika dipisahkan.
- `AvatarFallback`: loading/error/no-model state.

## 10. API dan Integrasi Roblox

- Username target: `Vaskrona`.
- Username bukan Roblox User ID; jika perlu API, resolve username menjadi User ID terlebih dahulu.
- Roblox avatar 3D endpoint dapat menghasilkan data model yang perlu diproses, bukan otomatis file GLB siap pakai.
- Jangan menyimpan secret/cookie Roblox di browser.
- Periksa dokumentasi Roblox terbaru sebelum mengimplementasikan endpoint.
- Jangan membuat API scraping yang melanggar ketentuan layanan.
- Implementasi utama harus tetap dapat berjalan dari file GLB lokal, tanpa ketergantungan runtime pada Roblox API.
- Jika API retrieval tidak dapat dilakukan secara aman/andal, dokumentasikan bahwa developer harus menaruh `vaskrona.glb` secara manual.

## 11. Performa

- Hindari membuat ulang model/geometry/material pada setiap render.
- Gunakan refs untuk perubahan transformasi yang berlangsung tiap frame.
- Gunakan texture dan model yang wajar ukurannya.
- Jangan menambah library animasi jika fungsi dapat diselesaikan dengan Three.js.
- Hindari efek post-processing berat secara default.
- Periksa performa pada perangkat laptop dan mobile kelas menengah.

## 12. Error Handling

Tangani minimal:
- Model GLB tidak ditemukan.
- File GLB tidak valid.
- Model tanpa animation clips.
- Avatar memiliki ukuran/posisi yang tidak sesuai.
- WebGL tidak tersedia.
- Pengunjung memakai perangkat mobile/touch.
- Animasi wave tidak ada.

Untuk kondisi tanpa animasi wave, fitur click reaction tetap berfungsi.

## 13. Acceptance Criteria

Project dinyatakan selesai jika:
- [ ] Dependency terpasang tanpa konflik yang tidak terselesaikan.
- [ ] Model `vaskrona.glb` dapat dimuat jika file tersedia.
- [ ] Loading dan error state ditampilkan dengan benar.
- [ ] Avatar terlihat dalam framing kamera yang wajar.
- [ ] Avatar melakukan idle motion ringan.
- [ ] Pointer tracking bekerja dan sudutnya terbatas.
- [ ] Drag dapat memutar model.
- [ ] Zoom bekerja dengan batas min/max.
- [ ] Klik avatar memunculkan reaksi dan pesan.
- [ ] Wave dimainkan hanya jika clip yang cocok tersedia.
- [ ] Layout dapat digunakan pada desktop dan mobile.
- [ ] Tidak ada error runtime utama di console.
- [ ] Halaman lain dan desain project existing tidak rusak.
- [ ] `npm run build` berhasil (atau perintah build setara pada project existing).

## 14. Validation Plan

Jalankan:
```bash
npm install
npm run dev
npm run build
```

Uji manual:
1. Buka halaman avatar.
2. Pastikan model tampil.
3. Gerakkan pointer masuk/keluar area avatar.
4. Drag model ke kiri/kanan dan atas/bawah.
5. Uji zoom.
6. Klik avatar beberapa kali.
7. Uji dengan file model yang tidak ada untuk memeriksa fallback.
8. Uji pada viewport mobile.
9. Periksa console dan network untuk error model/tekstur.

Jika project existing memiliki lint/test command, jalankan juga command yang tercantum pada `package.json`.

## 15. Instruksi Khusus untuk AI Argon

1. **Periksa project existing terlebih dahulu**: framework, dependency, routing, design system, struktur folder, dan halaman target.
2. Jangan membuat project baru jika user sudah membuka project yang ada.
3. Jangan mengganti framework atau mengubah konfigurasi global tanpa alasan kuat.
4. Jangan menghapus, merombak, atau mengubah kode unrelated.
5. Integrasikan avatar sebagai komponen terpisah dan gunakan halaman yang sesuai.
6. Jangan mengasumsikan `public/models/vaskrona.glb` sudah ada. Jika belum, siapkan fallback dan berikan instruksi asset yang dibutuhkan.
7. Implementasikan semua interaksi yang bisa dibuat tanpa animation clip. Wave harus conditional.
8. Jangan menyembunyikan error; jelaskan jika model atau izin export menjadi blocker.
9. Setelah coding, jalankan build/lint/test yang tersedia dan perbaiki error yang berasal dari implementasi.
10. Berikan ringkasan file yang dibuat/diubah, dependency yang ditambahkan, cara menjalankan, serta langkah yang masih perlu dilakukan oleh user.
11. Pertahankan gaya visual project existing; gunakan dark-purple hanya jika tidak bertentangan dengan desain saat ini.
12. Hindari penggunaan `any` jika project TypeScript; gunakan tipe yang tepat.

## 16. Definition of Done

Fitur avatar telah terintegrasi dan build berhasil. Avatar dapat dimuat dari GLB lokal, memiliki idle motion, pointer tracking, orbit/zoom, dan click reaction. Fitur skeletal wave aktif jika model menyediakan clip yang kompatibel. Dokumentasi menyebutkan dengan jelas jika asset GLB masih harus disiapkan manual.
