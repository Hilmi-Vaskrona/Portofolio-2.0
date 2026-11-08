# Penempatan Model Avatar 3D Roblox (Vaskrona)

Taruh file model avatar Roblox Anda di dalam folder ini (`public/models/`):

```text
public/
└── models/
    ├── vaskrona.gltf   <-- Format glTF (beserta file .bin dan tekstur .png/.jpg jika terpisah)
    └── vaskrona.glb    <-- ATAU format binary GLB (satu file utuh)
```

## Catatan Penting untuk Format `.gltf` vs `.glb`
1. **Jika menggunakan `vaskrona.gltf`**:
   - Pastikan file pendukungnya (seperti `vaskrona.bin` dan folder/file tekstur `.png`) juga ditaruh di folder `public/models/` yang sama agar material dan tekstur terbaca oleh `GLTFLoader`.
2. **Jika menggunakan `vaskrona.glb`**:
   - Cukup taruh satu file `vaskrona.glb` di `public/models/vaskrona.glb`.
3. Loader pada komponen `AvatarModel` akan otomatis memeriksa:
   - `/models/vaskrona.gltf`
   - `/models/vaskrona.glb`
   - `/vaskrona.gltf`
   - `/vaskrona.glb`
   Begitu salah satu file ditemukan, avatar 3D Anda akan langsung dimuat menggantikan model *stand-in* secara otomatis.

## Kenapa Export `.gltf` Langsung dari Roblox Studio Tidak Menyertakan Kepala & Aksesoris?
- Fitur **Export Selection -> `.gltf`** bawaan Roblox Studio saat ini hanya mengekspor `Part` biasa dan `MeshPart`, serta **melewatkan (`skip`) semua objek `SpecialMesh`** (yang digunakan oleh rig R6 untuk `Head` dan seluruh `Accessory` `Handle`), sehingga hanya menyisakan titik *attachment* (`Head_attachments`, `Hat_Att`, `Hair_Att`, dll.) dan 5 bagian badan (`Torso`, `Left/Right Arm`, `Left/Right Leg`).
- `AvatarModel.ts` sudah dilengkapi rekonstruksi otomatis yang membaca titik attachment tersebut dan memasangkan kepala beserta seluruh aksesoris khas **Vaskrona** (*Half-Glitched Faceless Head*, *Hiachi Grin Mask*, *Black&White Messy Bandaged Hair*, *Black White Halo Aura*, *All-Seeking Antlers*, *Wings of Corrupted Jerry*, *Reeling Petal Garland*, *Boo & Bub*, *Fuwatty Side Satchel*, dan *Substance Survival Belt*).
- **Tips (Opsional):** Jika suatu saat Anda ingin mengekspor *mesh* mentah kepala & aksesoris langsung dari Roblox Studio ke dalam satu file utuh:
  1. Klik kanan model avatar di Roblox Studio -> **Export Selection...** -> pilih format **`.obj`** (exporter `.obj` Roblox mendukung `SpecialMesh`).
  2. Buka file `.obj` tersebut di **Blender** (`File -> Import -> Wavefront (.obj)`).
  3. Ekspor dari Blender ke **`vaskrona.glb` / `vaskrona.gltf`** (`File -> Export -> glTF 2.0`).


