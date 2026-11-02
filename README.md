# Misty Peaks Estate — Direct-Booking Website with AI Enquiry Routing

> **Candidate Take-Home Assignment Submission**  
> **Client:** Company A, Chikkamagaluru, Karnataka  
> **Property:** 76-key coffee-estate resort (64 rooms + 12 villas) on 200 acres with lawns for weddings & offsites.  
> **Business Impact:** Recovers ₹1.05 crore/year by shifting agency share from 12% to 20% (+₹33.3 lakh) and eliminating slow enquiry response drop-offs (+₹72 lakh).

---

## 🌟 Architecture & Engineering Highlights

1. **Deterministic Allotment Control (Zero Overbooking)**:
   - Prevents selling agency-allotted inventory.
   - Every booking executes within a serialized database transaction (`prisma.$transaction`) that verifies real-time stock across every single night before confirming.
2. **Dual-Mode AI Enquiry Router**:
   - **Zero-Dependency Mode (Default)**: Fast (<5ms), resilient local NLP engine combining weighted keyword scoring, entity heuristics, and regex parsers. Runs 100% reliably out of the box with **no API keys required**.
   - **Live LLM Mode (Optional)**: Automatically activates if `GEMINI_API_KEY` is set in `.env.local` to leverage Gemini 1.5 Flash for natural language processing, with automatic fallback to the local engine on timeout or failure.
3. **AI Safety & Policy Guardrails**:
   - **Never Auto-Send**: All draft replies require human review.
   - **No Hallucinated Pricing**: Room rates in drafts are strictly injected from the database rate table.
   - **GM Alerting**: Guest complaints immediately trigger a high-priority GM alert badge.
   - **Unsorted Lane**: Low-confidence classifications (<0.65) route to the General Manager.
   - **1-Click Re-routing**: Staff can reassign any enquiry in a single click.
4. **Statutory & Hill-Station Design**:
   - **Dynamic GST Engine**: Automatic 12% tax slab for tariffs $\le ₹7,500$ (Deluxe Room) and 18% for tariffs $> ₹7,500$ (Premium, Suites, Villas).
   - **DPDP Act 2023 & Form C**: Guest privacy notices and explicit check-in collection for foreign passports.
   - **Performance**: High-contrast, lightweight layout designed for slow hill-station bandwidth.

---

## 📱 The 8 Core Screens Delivered

### Guest Experience (4 Screens)
- **Screen 1: Home & Estate Showcase (`/`)** — Hero scenery, plantation story, 6 room & villa types (64 rooms + 12 villas = 76 keys), transparent pricing with GST breakdown, "Book Direct" value strip.
- **Screen 2: Room Detail & Live Availability (`/rooms/[slug]`)** — Photo gallery, room specs, interactive check-in/out date checker with per-night rate breakdown + GST preview.
- **Screen 3: 3-Step Checkout & Confirmation (`/booking`)** — 3-step checkout: dates → room → confirm. Promo code support, simulated test payment, Form C notice, DPDP Act 2023 compliance. Instant confirmation summary with reference ID.
- **Screen 4: Weddings & Events Planner (`/enquiry`)** — Structured form for weddings & corporate offsites: date range, guest count, estimated budget, specific requirements (mandap, AV, lawn setups).

### Staff & GM Operations (4 Screens)
- **Screen 5: Bookings Dashboard & PMS Export (`/admin`)** — Today's arrivals/departures, total revenue, filterable booking log, and **1-click Daily Booking CSV Export** for the legacy reservation system.
- **Screen 6: Daily Rates & Allotment Grid (`/admin/rates`)** — 14-day calendar matrix across all 76 keys. Set daily dynamic rates, website allotment caps, and blackout dates. Prevents allotment from going below booked keys.
- **Screen 7: Promo Code Manager (`/admin/promos`)** — Manage flat and percentage discount codes (`DIRECTFIRST`, `COFFEE15`, `LONGSTAY3K`, `WEDDING2027`) with usage tracking and validity periods.
- **Screen 8: AI Unified Enquiry Inbox (`/admin/inbox`)** — Unified inbox for web forms, forwarded emails, and simulated WhatsApp. Real-time AI classification, entity extraction, owner assignment, and draft reply generator.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed Sample Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

> **What the seed loads:**
> - 6 Room Types totaling 76 keys (28 Deluxe, 24 Premium, 12 Suites, 6 Coffee Planter's Villas, 4 Heritage Villas, 2 Presidential Villas).
> - 540 Daily inventory records across 90 days.
> - 4 Active staff accounts (GM, Reservations Manager, Sales Manager, Front Office Manager).
> - 4 Promo codes (`DIRECTFIRST`, `COFFEE15`, `LONGSTAY3K`, `WEDDING2027`).
> - The sample enquiries from the brief (`ENQ-4410`, `ENQ-4411`, `ENQ-4412`, plus complaint and edge-case samples).

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Testing the AI Enquiry Routing

Navigate to **[`http://localhost:3000/admin/inbox`](http://localhost:3000/admin/inbox)** and click the **`Simulate Incoming Enquiry`** button in the top right.

### Built-in Test Scenarios:

| Preset Scenario | Incoming Message | AI Output & Verification |
|---|---|---|
| **Sister's Wedding (250 pax)** | *"Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights"* | ➜ Classified as **Wedding** (92%)<br>➜ Assigned to **Sales Manager**<br>➜ Extracted: 250 guests, Feb 2027<br>➜ Tailored draft reply asking for lawn vs. hall preferences |
| **Family Villa Request** | *"Is a villa free 14-16 Nov for 2 adults and a child?"* | ➜ Classified as **Room booking** (85%)<br>➜ Assigned to **Reservations Manager**<br>➜ Extracted: 3 guests, 14–16 Nov |
| **Corporate Offsite (45 pax)** | *"Team of 45 wants a January offsite with a conference hall"* | ➜ Classified as **Corporate offsite** (88%)<br>➜ Assigned to **Sales Manager**<br>➜ Extracted: 45 guests, January |
| **Guest Complaint** | *"The AC in villa 3 stopped working at midnight and water leaked on the bed..."* | ➜ Classified as **Complaint** (95%)<br>➜ Assigned to **Front Office**<br>➜ **🔴 GM Alert Triggered** |
| **Ambiguous Enquiry** | *"Hi, please send pictures and brochure."* | ➜ Classified as **General** (35%)<br>➜ **🟡 Low Confidence / GM Unsorted Lane** |

*(You can also type any custom message in the modal and submit it live).*

---

## ⚙️ Environment Variables (Optional)

Create a `.env.local` file in the project root if you wish to enable the optional live LLM mode:

```env
# Optional: If omitted, the fast, zero-dependency local NLP engine runs automatically
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema (RoomType, DailyInventory, Booking, Enquiry, Staff, PromoCode)
│   ├── seed.ts             # Seeds 76 keys, 90-day inventory, sample enquiries & promos
│   └── dev.db              # SQLite development database
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Screen 1: Home & room showcase
│   │   ├── rooms/[slug]/page.tsx       # Screen 2: Room detail & availability
│   │   ├── booking/                    # Screen 3: 3-step checkout & payment
│   │   ├── enquiry/page.tsx            # Screen 4: Structured wedding/event form
│   │   ├── admin/
│   │   │   ├── page.tsx                # Screen 5: Bookings dashboard
│   │   │   ├── rates/page.tsx          # Screen 6: Rates & allotment manager
│   │   │   ├── promos/page.tsx         # Screen 7: Promo code manager
│   │   │   └── inbox/page.tsx          # Screen 8: AI enquiry inbox & simulation modal
│   │   └── api/                        # REST APIs with transaction isolation
│   ├── lib/
│   │   ├── ai-router.ts    # Dual-mode AI classification, entity extraction & reply drafting
│   │   ├── gst.ts          # Statutory 12% vs 18% GST calculation
│   │   ├── prisma.ts       # Prisma Client singleton
│   │   └── utils.ts        # Currency formatters, ID generators, date helpers
└── README.md
```
