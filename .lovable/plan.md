

# Dokumentasi Project: Ootophia Brewing Labs

Dokumen ini akan menjadi **panduan lengkap** untuk melanjutkan atau membangun ulang project ini. File `PROJECT_DOCUMENTATION.md` akan dibuat di root project.

---

## Isi Dokumentasi

### 1. Project Overview
- Nama: **Ootophia Brewing Labs**
- Deskripsi: Sistem manajemen produksi dan penjualan untuk bisnis kopi dan teh
- Tech stack: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lovable Cloud (Supabase)

### 2. Fitur yang Sudah Selesai

Dokumentasi akan mencakup deskripsi lengkap setiap fitur beserta **prompt referensi** yang bisa digunakan untuk mereproduksi fitur tersebut:

- **Authentication & Role-Based Access Control** -- Sign-up (email, nama, username), 3 role (Admin/Sales/Reseller), account approval flow, menu filtering per role
- **Production Cost Calculator** -- Batch management, lineup system (Coffee & Tea), cost calculation, shrinkage tracking, cost summary per kategori
- **Multi-Category Support (Coffee & Tea)** -- Tea identity fields, processing logs, tea-specific labels & terminologi, shrinkage range berbeda
- **Products Management** -- CRUD produk, HPP calculation, stock tracking, bundles
- **Sales Journal** -- Transaksi (sale/promo/rnd/bonus), invoice generation, PDF export
- **Role-Based Dashboards** -- Admin (full metrics + user management), Sales (sales-focused), Reseller (limited view)
- **Account Management Center** -- Approve/reject users, change roles, create new accounts
- **Invoice History** -- Riwayat invoice dengan preview
- **Customer Management** -- CRUD pelanggan, member status
- **Batch Profitability** -- Analisis profitabilitas per batch
- **POS API** -- Edge function untuk integrasi POS eksternal
- **Dark/Light Mode** -- Theme toggle dengan context

### 3. Database Schema Summary
Ringkasan semua tabel: profiles, user_roles, batches, lineups, roast_logs, products, bundles, bundle_products, transactions, invoices, customers, stock_adjustments -- beserta relasi dan RLS policies penting.

### 4. Arsitektur & Pola Kode
- Hooks pattern (useLineups, useProducts, useBatches, dll.)
- Calculation service terpisah di `src/lib/calculations.ts`
- Role-based rendering di Sidebar dan Dashboard
- Protected routes dengan account status check

### 5. Roadmap & Fitur yang Bisa Dikembangkan
Berdasarkan roadmap yang sudah direncanakan:

- **Phase 1 (Tea Category)**: Blending/aging tracking, tea-specific processing methods dengan biaya berbeda
- **Phase 2 (POS System)**: Mode Retail, Wholesale, Event
- **Phase 3 (E-Commerce)**: Online checkout, WhatsApp integration, real-time stock sync
- **Fitur tambahan**: Komisi per reseller, laporan per sales/reseller, notifikasi email, export PDF per kategori

### 6. Reproduction Prompts
Kumpulan prompt siap pakai untuk membangun ulang setiap fitur dari awal, dikelompokkan per modul.

---

## Detail Teknis

- **File yang dibuat**: `PROJECT_DOCUMENTATION.md` di root project
- **Format**: Markdown dengan sections yang jelas, termasuk code snippets untuk schema dan prompt references
- **Panjang**: Komprehensif tapi terstruktur -- mudah di-scan dan di-cari

