# 📋 Ootophia Brewing Labs — Project Documentation

> Dokumen ini adalah **panduan lengkap** untuk melanjutkan, memelihara, atau membangun ulang project dari awal.  
> **Terakhir diperbarui:** 2026-02-27

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| **Nama** | Ootophia Brewing Labs |
| **Deskripsi** | Sistem manajemen produksi dan penjualan untuk bisnis kopi & teh |
| **Tech Stack** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Lovable Cloud (Supabase) — Auth, Database, Edge Functions, Realtime |
| **State Management** | TanStack React Query + React Context |
| **Charting** | Recharts |
| **PDF** | jsPDF + jspdf-autotable |
| **Routing** | React Router v7 |

---

## 2. Fitur yang Sudah Selesai

### 2.1 Authentication & Role-Based Access Control

**Deskripsi:** Sign-up dengan email, nama lengkap, dan username. 3 role (Admin/Sales/Reseller). Akun baru berstatus `pending` dan harus di-approve admin. Menu sidebar difilter berdasarkan role.

**Komponen utama:**
- `src/pages/Auth.tsx` — Form login & sign-up dengan validasi Zod
- `src/contexts/AuthContext.tsx` — Auth context (signIn, signUp, signOut)
- `src/components/ProtectedRoute.tsx` — Guard route + tampilan pending/rejected
- `src/hooks/useUserRole.ts` — Hook untuk role & account status
- `src/components/Layout/Sidebar.tsx` — Menu filtering per role

**Database tables:** `profiles`, `user_roles`  
**Enums:** `app_role` = admin | sales | reseller

**Reproduction Prompt:**
```
Buat authentication system dengan Supabase Auth:
- Sign-up form: email, password, nama lengkap, username (unique, lowercase)
- Sign-in form: email, password
- Setelah sign-up, user otomatis berstatus "pending" dan harus di-approve admin
- Buat tabel user_roles dengan enum (admin, sales, reseller)
- Buat tabel profiles dengan kolom: full_name, username, account_status (pending/approved/rejected)
- Buat trigger: setelah user sign-up, otomatis insert ke profiles dan user_roles (default: reseller)
- Buat ProtectedRoute component yang cek status akun — tampilkan UI "Menunggu Persetujuan" jika pending, "Akses Ditolak" jika rejected
- Buat Sidebar dengan menu yang difilter berdasarkan role:
  - Admin: semua menu
  - Sales: Dashboard, Products, Sales Journal, Invoice History, Customers, Settings
  - Reseller: Dashboard, Sales Journal, Customers, Settings
```

---

### 2.2 Production Cost Calculator

**Deskripsi:** Sistem batch management untuk menghitung biaya produksi. Setiap batch memiliki lineup (varian kopi/teh) dengan tracking biaya bahan baku, jasa processing, transport, dan shrinkage.

**Komponen utama:**
- `src/pages/CostCalculator.tsx` — Halaman utama (batch list + lineup management)
- `src/components/CostCalculator/LineupForm.tsx` — Form lengkap per lineup (identity, costs, logs, cost summary)
- `src/components/CostCalculator/BatchHeader.tsx` — Header batch
- `src/components/CostCalculator/BatchListView.tsx` — List semua batch
- `src/components/CostCalculator/LineupTabs.tsx` — Tab navigasi antar lineup
- `src/lib/calculations.ts` — Semua fungsi kalkulasi

**Database tables:** `batches`, `lineups`, `roast_logs`

**Hooks:** `src/hooks/useBatches.ts`, `src/hooks/useLineups.ts`

**Kalkulasi utama:**
- `calculateTotalInitialCost(lineup)` — Total biaya awal (bahan baku + shipping + jasa + transport)
- `calculateTotalRoastedOutput(lineup)` — Total output dari semua roast/process logs
- `calculateShrinkagePercentage(lineup)` — Persentase weight loss
- `calculateCostPerGram(lineup)` — HPP per gram
- `calculateWeightForSale(lineup)` — Berat tersedia untuk dijual (output - alokasi RnD - alokasi promo)
- `getExpectedShrinkageRange(category)` — Range shrinkage: Coffee 15-20%, Tea 5-15%

**Reproduction Prompt:**
```
Buat Production Cost Calculator:
- Batch management: CRUD batch dengan kode, nama, tema, deskripsi, tanggal mulai
- Lineup system: setiap batch punya multiple lineup (varian produk)
- Per lineup, input: purchase date, initial weight, green beans price/kg, shipping cost, processing service (per kg atau per batch), transport cost
- Roast/Processing logs: multiple entries dengan input weight, output weight, date
- Alokasi: RnD dan Promo (gram) — mengurangi berat yang bisa dijual
- Cost Summary: PieChart breakdown biaya, total cost, cost per gram, weight for sale, shrinkage percentage
- Bar chart: input vs output per roast log
- Semua data tersimpan di database
```

---

### 2.3 Multi-Category Support (Coffee & Tea)

**Deskripsi:** Lineup bisa berkategori "coffee" atau "tea". Label, terminologi, dan expected shrinkage range berbeda per kategori.

**Komponen khusus Tea:**
- `src/components/CostCalculator/TeaIdentityForm.tsx` — Form identity tea (type, grade, harvest season, processing method, supplier)
- `src/components/CostCalculator/TeaProductionForm.tsx` — Production form khusus tea
- `src/components/CostCalculator/CoffeeIdentityForm.tsx` — Form identity coffee (origin, process, variety, processor, roaster)

**Perbedaan label Tea vs Coffee:**
| Coffee | Tea |
|--------|-----|
| Green Beans Price | Tea Leaf Price |
| Roasting Service | Processing Service |
| Roasting Transport | Processing Transport |
| Roast Logs | Processing Logs |
| Add Roast | Add Process |
| Bean Allocations | Tea Allocations |
| Shrinkage | Weight Loss |
| Expected: 15-20% | Expected: 5-15% |

**Tea Identity fields:** `teaType` (green/black/oolong/white/herbal/pu-erh), `teaGrade` (premium/standard/economy), `harvestSeason`, `processingMethod` (orthodox/ctc/blending/aging/fermentation), `supplier`

**Reproduction Prompt:**
```
Tambahkan dukungan multi-kategori (Coffee & Tea) ke Production Cost Calculator:
- Setiap lineup punya field "category": "coffee" | "tea"
- Tea Identity form: origin, tea type (green/black/oolong/white/herbal/pu-erh), grade (premium/standard/economy), harvest season, processing method (orthodox/ctc/blending/aging/fermentation), supplier, tasting notes
- Label dinamis: "Tea Leaf Price" bukan "Green Beans Price", "Processing Service" bukan "Roasting Service", dll
- Expected shrinkage range berbeda: Tea 5-15%, Coffee 15-20%
- Cost Summary dengan label khusus per kategori (Tea Leaf Cost, Processing Cost vs Bean Cost, Roasting Cost)
- Color-coded status indicator untuk shrinkage (excellent/normal/high) berdasarkan range kategori
```

---

### 2.4 Products Management

**Deskripsi:** CRUD produk yang terkait lineup. Hitung HPP otomatis berdasarkan cost per gram lineup. Stock tracking dengan threshold alert. Bundle produk dengan harga custom.

**Komponen utama:**
- `src/pages/Products.tsx` — Halaman produk
- `src/components/Products/ProductDialog.tsx` — Dialog add/edit produk
- `src/components/Products/BundleDialog.tsx` — Dialog add/edit bundle
- `src/components/Products/StockAdjustmentDialog.tsx` — Adjust stok manual

**Database tables:** `products`, `bundles`, `bundle_products`, `stock_adjustments`

**Hooks:** `src/hooks/useProducts.ts`, `src/hooks/useBundles.ts`, `src/hooks/useStockAdjustments.ts`

**Kalkulasi HPP:**
```typescript
calculateProductHPP(product, costPerGram) → { beanCost, totalHPP, sellingPrice }
// beanCost = netWeight × costPerGram
// totalHPP = beanCost + packagingCost + labelCost + marketingCost
// sellingPrice = totalHPP × (1 + marginPercentage/100)
```

**Reproduction Prompt:**
```
Buat Products Management:
- CRUD produk: nama, lineup (dropdown dari lineup yang ada), net weight (gram), packaging cost, label cost, marketing cost, margin percentage, stock, stock threshold
- Otomatis hitung HPP: bean cost (net weight × cost per gram dari lineup) + packaging + label + marketing
- Harga jual = HPP × (1 + margin%)
- Stock tracking dengan threshold — alert jika stok ≤ threshold
- Stock adjustment: manual adjust stok dengan reason
- Bundles: gabungan produk dengan harga custom
- Simpan semua ke database dengan RLS per user
```

---

### 2.5 Sales Journal

**Deskripsi:** Catat transaksi penjualan, promo, RnD, dan bonus. Generate invoice. Export PDF.

**Komponen utama:**
- `src/pages/SalesJournal.tsx` — Halaman jurnal
- `src/components/SalesJournal/TransactionForm.tsx` — Form transaksi baru
- `src/components/SalesJournal/InvoicePreviewDialog.tsx` — Preview invoice
- `src/components/SalesJournal/EditTransactionDialog.tsx` — Edit transaksi
- `src/components/SalesJournal/EditConfirmationDialog.tsx` — Konfirmasi edit

**Database tables:** `transactions`, `invoices`

**Hooks:** `src/hooks/useTransactions.ts`, `src/hooks/useInvoices.ts`

**Transaction status:** `sale` | `promo` | `rnd` | `bonus`

**Reproduction Prompt:**
```
Buat Sales Journal:
- Form transaksi: tanggal, status (sale/promo/rnd/bonus), pilih produk atau bundle, quantity, nama pelanggan, deskripsi
- Untuk status "sale": otomatis kurangi stok produk, catat stock adjustment
- Untuk "promo"/"rnd": catat sebagai alokasi terpakai
- Tabel transaksi dengan filter dan sort
- Generate invoice dari transaksi terpilih
- Invoice preview dialog
- Export invoice ke PDF (jsPDF + autotable)
- Edit dan hapus transaksi dengan konfirmasi
```

---

### 2.6 Role-Based Dashboards

**Deskripsi:** Dashboard berbeda per role.

- **Admin:** Full KPI (revenue, units sold, active batches, total products, total users), pending user alert, analytics charts, sales summary, inventory overview, low stock alerts
- **Sales:** Sales-focused metrics, recent transactions, top products
- **Reseller:** Limited view, own transactions only

**Komponen:**
- `src/pages/Dashboard.tsx` — Router dashboard berdasarkan role
- `src/components/Dashboard/SalesDashboard.tsx`
- `src/components/Dashboard/ResellerDashboard.tsx`
- `src/components/Dashboard/AnalyticsCharts.tsx`
- `src/components/Dashboard/SalesSummary.tsx`

**Reproduction Prompt:**
```
Buat role-based dashboards:
- Admin Dashboard: 5 KPI cards (revenue, units sold, active batches, products, users), pending users alert, analytics charts (revenue trend, sales by product, category distribution), sales summary table, inventory overview per lineup, low stock alerts
- Sales Dashboard: revenue & units KPIs, recent transactions, top selling products
- Reseller Dashboard: own transactions summary, limited metrics
- Realtime subscription untuk auto-refresh saat ada transaksi baru
```

---

### 2.7 Account Management Center

**Deskripsi:** Admin bisa approve/reject pendaftaran user, ubah role, dan buat akun baru.

**Komponen:** `src/components/Settings/AccountManagement.tsx`

**Hooks:** `useAllUsers()`, `useManageUsers()` (di `src/hooks/useUserRole.ts`)

**Reproduction Prompt:**
```
Buat Account Management di halaman Settings (hanya untuk Admin):
- Tabel semua user: nama, username, status, role, tanggal daftar
- Approve/Reject user pending
- Change role (admin/sales/reseller)
- Filter by status (all/pending/approved/rejected)
```

---

### 2.8 Invoice History

**Komponen:**
- `src/pages/InvoiceHistory.tsx`
- `src/components/InvoiceHistory/InvoiceHistoryPreviewDialog.tsx`

---

### 2.9 Customer Management

**Komponen:** `src/pages/Customers.tsx`  
**Database:** `customers` (name, phone, email, address, is_member, notes)  
**Hook:** `src/hooks/useCustomers.ts`

---

### 2.10 Batch Profitability

**Komponen:** `src/pages/BatchProfitability.tsx`  
Analisis profitabilitas per batch — revenue vs cost, margin analysis.

---

### 2.11 POS API (Edge Function)

**File:** `supabase/functions/pos-api/index.ts`

**Endpoints:**
| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/products` | Daftar produk dengan harga jual (stok > 0) |
| GET | `/bundles` | Daftar bundle dengan produk |
| GET | `/customers` | Daftar pelanggan |
| POST | `/transactions` | Buat transaksi baru (otomatis kurangi stok) |
| GET | `/transactions?limit=50&offset=0` | Riwayat transaksi |
| GET | `/stock` | Status stok semua produk |

**Auth:** Bearer token (JWT) atau `x-api-key` header.

**Reproduction Prompt:**
```
Buat POS API sebagai Edge Function:
- GET /products: return produk dengan stok > 0, termasuk calculated selling price
- GET /bundles: return bundle dengan daftar produk
- GET /customers: return pelanggan
- POST /transactions: buat transaksi, validasi stok, kurangi stok, catat stock adjustment
- GET /transactions: riwayat dengan pagination (limit, offset)
- GET /stock: status stok dengan flag isLow
- Auth: support Bearer JWT dan x-api-key
- CORS headers untuk cross-origin
```

---

### 2.12 Dark/Light Mode

**Komponen:** `src/contexts/ThemeContext.tsx`  
Toggle via Sidebar footer. Menggunakan class-based dark mode Tailwind.

---

### 2.13 Business Profile & Settings

**Komponen:**
- `src/pages/Settings.tsx`
- `src/components/Settings/BusinessProfileForm.tsx`

**Hook:** `src/hooks/useProfile.ts`

---

## 3. Database Schema Summary

### Tables

```
profiles
├── id (uuid, PK, references auth.users)
├── full_name, username, email
├── account_status (pending/approved/rejected)
├── business_name, phone, address, logo
├── payment_methods (jsonb)
├── theme_hue (int)
└── created_at, updated_at

user_roles
├── id (uuid, PK)
├── user_id (uuid, references profiles)
├── role (app_role enum: admin/sales/reseller)
└── created_at

batches
├── id (uuid, PK)
├── user_id (uuid, references profiles)
├── code, name, theme, description
├── start_date
└── created_at, updated_at

lineups
├── id (uuid, PK)
├── user_id, batch_id (FK → batches)
├── name, category (coffee/tea), lineup_code
├── initial_weight, purchase_date
├── green_beans_price, green_beans_shipping
├── roasting_service, roasting_service_type, roasting_transport
├── origin, process, variety, processor, roaster, tasting_notes
├── tea_type, tea_grade, harvest_season, processing_method
├── rnd_allocation, promo_allocation
├── rnd_allocation_used, promo_allocation_used
└── created_at, updated_at

roast_logs
├── id (uuid, PK)
├── lineup_id (FK → lineups)
├── date, input_weight, output_weight
└── created_at

products
├── id (uuid, PK)
├── user_id, lineup_id (FK → lineups)
├── name, net_weight
├── packaging_cost, label_cost, marketing_cost, margin_percentage
├── stock, stock_threshold
└── created_at, updated_at

bundles
├── id (uuid, PK)
├── user_id, name, custom_price
└── created_at, updated_at

bundle_products
├── bundle_id (FK → bundles)
└── product_id (FK → products)

transactions
├── id (uuid, PK)
├── user_id, product_id, bundle_id, lineup_id
├── date, status (sale/promo/rnd/bonus)
├── quantity, total_value
├── customer_name, description
└── created_at

invoices
├── id (uuid, PK)
├── user_id, invoice_number, date, status
├── customer_id, customer_name, customer_email, customer_phone, customer_address
├── items (jsonb), subtotal, total
├── transaction_ids (text[])
├── description
└── created_at, updated_at

customers
├── id (uuid, PK)
├── user_id, name, phone, email, address
├── is_member, notes
└── created_at, updated_at

stock_adjustments
├── id (uuid, PK)
├── user_id, product_id, transaction_id
├── previous_stock, new_stock
├── adjustment_type, reason
└── created_at
```

### Database Functions

- `get_user_role(user_id)` → returns `app_role`
- `has_role(role, user_id)` → returns boolean
- `is_admin(user_id)` → returns boolean

---

## 4. Arsitektur & Pola Kode

### Struktur Folder

```
src/
├── pages/           → Route-level components
├── components/
│   ├── Layout/      → AppLayout, Sidebar, Header
│   ├── CostCalculator/ → Lineup forms, batch views
│   ├── Dashboard/   → Role-specific dashboards
│   ├── Products/    → Product & bundle dialogs
│   ├── SalesJournal/ → Transaction forms, invoice
│   ├── Settings/    → Business profile, account mgmt
│   ├── InvoiceHistory/
│   └── ui/          → shadcn/ui components
├── hooks/           → Custom hooks (data fetching via React Query)
├── contexts/        → AuthContext, ThemeContext
├── lib/             → calculations.ts, utils, exportUtils, pdfGenerator
├── types/           → TypeScript interfaces
└── integrations/    → Supabase client & types (auto-generated)
```

### Pola Custom Hooks

Semua data fetching menggunakan TanStack React Query melalui custom hooks:

```typescript
// Pattern umum:
export function useProducts() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['products'], queryFn: ... });
  const addMutation = useMutation({ mutationFn: ..., onSuccess: invalidate });
  const updateMutation = useMutation({ ... });
  const deleteMutation = useMutation({ ... });
  return { products: query.data, addProduct, updateProduct, deleteProduct, isLoading };
}
```

### Role-Based Rendering

```typescript
// Di Sidebar: filter menu berdasarkan role
const filteredNavigation = navigation.filter(item => role && item.roles.includes(role));

// Di Dashboard: render komponen berbeda per role
if (isReseller) return <ResellerDashboard />;
if (isSales) return <SalesDashboard />;
return <AdminDashboard />; // default admin
```

### Protected Routes

```typescript
// App.tsx
<Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route index element={<Dashboard />} />
  ...
</Route>

// ProtectedRoute cek: user exists? → account_status approved? → render children
```

### Calculation Service

Semua kalkulasi terpusat di `src/lib/calculations.ts`:
- Pure functions, no side effects
- Menerima `Lineup` dan/atau `Product` objects
- Return computed values (costs, weights, percentages)

---

## 5. Variabel Perhitungan & Algoritma

### 5.1 Variabel Database yang Digunakan dalam Perhitungan

#### Tabel `lineups` — Variabel Biaya Produksi

| Kolom | Tipe | Satuan | Keterangan |
|-------|------|--------|------------|
| `green_beans_price` | numeric | IDR/kg | Harga bahan baku per kilogram (green beans untuk kopi, tea leaf untuk teh) |
| `green_beans_shipping` | numeric | IDR (flat) | Biaya pengiriman bahan baku — flat fee per lineup |
| `roasting_service` | numeric | IDR/kg atau IDR/batch | Biaya jasa processing (roasting/pengolahan) |
| `roasting_service_type` | text | `"perKg"` atau `"perBatch"` | Menentukan cara hitung biaya jasa: per kilogram input atau flat per batch |
| `roasting_transport` | numeric | IDR (flat) | Biaya transport ke/dari tempat processing — flat fee |
| `initial_weight` | numeric | gram | Berat awal bahan baku yang dibeli |
| `rnd_allocation` | numeric | gram | Kuota berat yang dialokasikan untuk R&D (tidak dijual) |
| `promo_allocation` | numeric | gram | Kuota berat yang dialokasikan untuk promosi (tidak dijual) |
| `rnd_allocation_used` | numeric | gram | Jumlah alokasi R&D yang sudah terpakai |
| `promo_allocation_used` | numeric | gram | Jumlah alokasi Promo yang sudah terpakai |
| `category` | text | `"coffee"` atau `"tea"` | Menentukan label UI dan expected shrinkage range |

#### Tabel `roast_logs` — Log Proses Produksi

| Kolom | Tipe | Satuan | Keterangan |
|-------|------|--------|------------|
| `input_weight` | numeric | gram | Berat bahan mentah yang masuk proses (per sesi roasting/processing) |
| `output_weight` | numeric | gram | Berat hasil setelah proses (selalu < input karena shrinkage) |
| `date` | date | - | Tanggal proses dilakukan |

#### Tabel `products` — Variabel Biaya Produk

| Kolom | Tipe | Satuan | Keterangan |
|-------|------|--------|------------|
| `net_weight` | numeric | gram | Berat bersih produk per unit kemasan |
| `packaging_cost` | numeric | IDR/unit | Biaya kemasan per unit produk |
| `label_cost` | numeric | IDR/unit | Biaya label per unit produk |
| `marketing_cost` | numeric | IDR/unit | Biaya marketing per unit produk |
| `margin_percentage` | numeric | % | Persentase margin keuntungan di atas HPP |
| `stock` | integer | unit | Jumlah stok saat ini |
| `stock_threshold` | integer | unit | Batas minimum stok sebelum alert |

---

### 5.2 Workflow Produksi (Production Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. BUAT BATCH                                                      │
│     └─ Batch = grup produksi (misal: "Batch Maret 2026")            │
│        └─ Memiliki: code, name, theme, description, start_date      │
│                                                                     │
│  2. TAMBAH LINEUP (dalam batch)                                     │
│     └─ Lineup = satu varian produk (misal: "Aceh Gayo Natural")     │
│        └─ Pilih kategori: Coffee atau Tea                           │
│        └─ Isi identity (origin, process, variety, dll.)             │
│        └─ Isi data pembelian bahan baku:                            │
│           • Purchase date                                           │
│           • Initial weight (gram)                                   │
│           • Harga bahan baku per kg                                 │
│           • Biaya shipping (flat)                                   │
│           • Biaya jasa processing (per kg ATAU per batch)           │
│           • Biaya transport processing (flat)                       │
│                                                                     │
│  3. CATAT PROCESSING LOGS (Roast Logs / Processing Logs)            │
│     └─ Setiap sesi processing = 1 log entry                        │
│     └─ Input: tanggal, input weight, output weight                  │
│     └─ Bisa ada MULTIPLE logs per lineup (misal: 3× roasting)      │
│     └─ Total input & output dihitung dari SEMUA log entries         │
│                                                                     │
│  4. SET ALOKASI (Bean/Tea Allocations)                              │
│     └─ Tentukan berapa gram untuk:                                  │
│        • R&D (sample, cupping, eksperimen)                          │
│        • Promo (giveaway, sample gratis)                            │
│     └─ Sisa = "Weight for Sale" (yang bisa dijadikan produk)        │
│                                                                     │
│  5. BUAT PRODUK (dari lineup)                                       │
│     └─ Produk mengambil bahan dari "Weight for Sale"                │
│     └─ Setiap produk punya: net weight, packaging/label/marketing   │
│     └─ HPP & harga jual otomatis dihitung                          │
│     └─ Set stock (berapa unit yang diproduksi)                      │
│                                                                     │
│  6. JUAL (Sales Journal)                                            │
│     └─ Catat transaksi: sale → kurangi stok otomatis                │
│     └─ Atau: promo/rnd → kurangi alokasi terpakai                  │
│     └─ Generate invoice dari transaksi                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Algoritma Perhitungan — Step by Step

#### A. Total Production Cost (Biaya Produksi Total)

Dihitung di `src/lib/calculationService.ts` → `getTotalProductionCost(lineup)`

```
STEP 1: Hitung Total Input Weight
  totalInput = SUM(roast_logs[].input_weight)
  → Contoh: 3 sesi roasting × 2000g = 6000g

STEP 2: Hitung Raw Material Cost (Biaya Bahan Baku)
  rawMaterialCost = (green_beans_price × totalInput) / 1000
  → green_beans_price dalam IDR/kg, totalInput dalam gram
  → Contoh: (Rp 200.000/kg × 6000g) / 1000 = Rp 1.200.000

STEP 3: Hitung Processing Service Cost (Biaya Jasa)
  JIKA roasting_service_type == "perKg":
    processingCost = (roasting_service × totalInput) / 1000
    → Contoh: (Rp 50.000/kg × 6000g) / 1000 = Rp 300.000
  JIKA roasting_service_type == "perBatch":
    processingCost = roasting_service × jumlah_roast_logs
    → Contoh: Rp 100.000/batch × 3 sesi = Rp 300.000

STEP 4: Jumlahkan Semua Biaya
  totalCost = rawMaterialCost 
            + green_beans_shipping (flat)
            + processingCost
            + roasting_transport (flat)
  → Contoh: 1.200.000 + 50.000 + 300.000 + 30.000 = Rp 1.580.000
```

#### B. Weight for Sale (Berat Tersedia untuk Dijual)

```
STEP 1: Hitung Total Roasted Output
  totalOutput = SUM(roast_logs[].output_weight)
  → Contoh: (1700 + 1680 + 1720) = 5100g

STEP 2: Kurangi Alokasi
  weightForSale = totalOutput - rnd_allocation - promo_allocation
  → Contoh: 5100 - 100 - 50 = 4950g
```

#### C. Cost Per Gram (HPP per Gram Bahan Olahan)

```
costPerGram = totalProductionCost / weightForSale
→ Contoh: Rp 1.580.000 / 4950g = Rp 319,19/gram

⚠️ PENTING: Cost per gram dihitung dari WEIGHT FOR SALE,
   bukan dari total output. Ini karena biaya R&D dan promo
   ditanggung oleh produk yang dijual.
```

#### D. Shrinkage Percentage (Persentase Susut)

```
shrinkage = ((totalInput - totalOutput) / totalInput) × 100%
→ Contoh: ((6000 - 5100) / 6000) × 100 = 15%

Expected ranges:
  Coffee: 15-20% (normal roasting loss)
  Tea: 5-15% (drying/processing loss)
  
Status indicator:
  < min → "Excellent" (hijau)
  min-max → "Normal" (kuning)
  > max → "High" (merah)
```

#### E. Product HPP (Harga Pokok Produksi per Unit Produk)

Dihitung di `src/lib/calculationService.ts` → `getProductHPP(product, costPerGram)`

```
STEP 1: Hitung Bean Cost per Unit
  beanCost = net_weight × costPerGram
  → Contoh: 200g × Rp 319,19/g = Rp 63.838

STEP 2: Hitung Total Packaging Cost
  packagingTotal = packaging_cost + label_cost + marketing_cost
  → Contoh: 5.000 + 2.000 + 3.000 = Rp 10.000

STEP 3: Hitung HPP (Cost of Goods)
  totalHPP = beanCost + packagingTotal
  → Contoh: 63.838 + 10.000 = Rp 73.838

STEP 4: Hitung Harga Jual
  sellingPrice = totalHPP × (1 + margin_percentage / 100)
  → Contoh: 73.838 × (1 + 40/100) = 73.838 × 1.4 = Rp 103.373
  → Dibulatkan ke bilangan bulat: Rp 103.373

STEP 5: Hitung Profit per Unit
  profitPerUnit = sellingPrice - totalHPP
  → Contoh: 103.373 - 73.838 = Rp 29.535
```

#### F. Available Beans (Sisa Berat untuk Produk Baru)

```
weightAssigned = SUM(products[lineup_id=this].net_weight × stock)
availableBeans = weightForSale - weightAssigned

→ Contoh: 
   Product A: 200g × 10 unit = 2000g
   Product B: 100g × 15 unit = 1500g
   weightAssigned = 3500g
   availableBeans = 4950 - 3500 = 1450g tersisa
```

#### G. Allocation Usage (Pemakaian Alokasi dari Transaksi)

```
rndUsed = SUM(transactions[lineup_id=this AND status="rnd"].quantity)
promoUsed = SUM(transactions[lineup_id=this AND status="promo"].quantity)

remainingRnd = rnd_allocation - rndUsed
remainingPromo = promo_allocation - promoUsed
```

---

### 5.4 Format Angka

| Fungsi | Format | Contoh |
|--------|--------|--------|
| `formatCurrency(amount)` | IDR tanpa desimal | Rp 1.580.000 |
| `formatWeight(grams)` | gram atau kg (≥1000g) | 4.950 g atau 4,95 kg |
| Internal precision | 4 desimal | 319.1919 |
| Harga jual | Bulat (0 desimal) | Rp 103.373 |

---

### 5.5 Diagram Alur Data Perhitungan

```
lineups.green_beans_price ──┐
lineups.green_beans_shipping ┤
lineups.roasting_service ────┼──→ getTotalProductionCost() ──┐
lineups.roasting_service_type┤                                │
lineups.roasting_transport ──┘                                │
                                                              ├──→ getCostPerGram()
roast_logs[].output_weight ──┐                                │
lineups.rnd_allocation ──────┼──→ getWeightForSale() ─────────┘
lineups.promo_allocation ────┘         │
                                       │
                    costPerGram ────────┼──→ getProductHPP()
                                       │      │
products.net_weight ───────────────────┘      │
products.packaging_cost ──┐                    │
products.label_cost ──────┼────────────────────┤
products.marketing_cost ──┘                    │
products.margin_percentage ────────────────────┘
                                               │
                                               ▼
                                    { beanCost, totalHPP, 
                                      sellingPrice, profitPerUnit }
```

---

## 6. Roadmap & Fitur yang Bisa Dikembangkan

### Phase 1: Tea Category Enhancement
- [ ] Blending/aging tracking dengan timeline
- [ ] Tea-specific processing methods dengan biaya berbeda per method
- [ ] Export laporan production cost ke PDF per kategori

### Phase 2: POS System
- [ ] Mode Retail (walk-in customers)
- [ ] Mode Wholesale (bulk orders, pricing tiers)
- [ ] Mode Event (pop-up, bazaar)
- [ ] Barcode/QR scanning
- [ ] Receipt printing

### Phase 3: E-Commerce Integration
- [ ] Online catalog/checkout page
- [ ] WhatsApp order integration
- [ ] Real-time stock sync dengan POS
- [ ] Payment gateway integration

### Fitur Tambahan
- [ ] Komisi per reseller (percentage-based)
- [ ] Laporan per sales/reseller
- [ ] Notifikasi email (stok rendah, pesanan baru)
- [ ] Export PDF per kategori (coffee report, tea report)
- [ ] Multi-currency support
- [ ] Supplier management
- [ ] Production scheduling/calendar

---

## 7. Quick Reference: Konfigurasi Penting

### Environment Variables (auto-managed)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

### File yang TIDAK boleh diedit manual
- `src/integrations/supabase/client.ts` (auto-generated)
- `src/integrations/supabase/types.ts` (auto-generated)
- `supabase/config.toml` (auto-generated)
- `.env` (auto-generated)

### Realtime Subscriptions
Dashboard menggunakan realtime untuk `transactions`, `products`, dan `lineups` tables.

---

## 8. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| User tidak bisa login setelah sign-up | Cek `account_status` di profiles — harus "approved" |
| Menu tidak muncul | Cek `user_roles` — role harus sesuai |
| HPP 0 atau NaN | Pastikan lineup punya roast_logs dengan output > 0 |
| Stok tidak berkurang | Pastikan transaksi berstatus "sale" dan product_id terisi |
| POS API 401 | Cek Bearer token atau x-api-key header |

---

*Dokumen ini dibuat otomatis dan harus di-update setiap kali ada perubahan signifikan pada fitur atau arsitektur project.*
