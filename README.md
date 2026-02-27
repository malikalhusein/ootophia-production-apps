# ☕ Ootophia Brewing Labs

> Sistem manajemen produksi dan penjualan untuk bisnis kopi & teh — dari hitung HPP hingga invoice.

## Tentang Project

**Ootophia Brewing Labs** adalah aplikasi web all-in-one untuk mengelola seluruh alur bisnis kopi dan teh:

- **Production Cost Calculator** — Hitung biaya produksi per batch & lineup (Coffee & Tea), tracking shrinkage, cost per gram
- **Products Management** — Kelola produk, HPP otomatis, stock tracking, bundles
- **Sales Journal** — Catat transaksi (sale/promo/RnD/bonus), generate invoice, export PDF
- **Role-Based Access** — 3 role (Admin, Sales, Reseller) dengan menu & dashboard berbeda
- **Customer Management** — Database pelanggan dengan status member
- **Batch Profitability** — Analisis profit per batch
- **POS API** — Backend function untuk integrasi sistem kasir eksternal
- **Dark/Light Mode**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State | TanStack React Query, React Context |
| Backend | Lovable Cloud (Auth, Database, Edge Functions) |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Routing | React Router v7 |

## Getting Started

```sh
# Clone & install
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i

# Run dev server
npm run dev
```

## Dokumentasi Lengkap

Lihat **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** untuk:
- Detail setiap fitur & reproduction prompts
- Database schema
- Arsitektur & pola kode
- Roadmap pengembangan
- Troubleshooting

## Links

- **Lovable Project**: https://lovable.dev/projects/35fdfe1f-11d2-45c1-a99d-e3d43bd3904b
- **Dokumentasi Lovable**: https://docs.lovable.dev
