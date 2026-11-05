# Misty Peaks Estate — Direct-Booking Website & AI Enquiry Router

**Candidate Technical Assessment**  
**Client:** Company A, Chikkamagaluru, Karnataka  
**Scope:** 76-key coffee-estate resort (64 rooms, 12 villas) on 200 acres with event lawns.  
**Business Impact:** ₹1.05 crore annual savings target (₹33.3 lakh via direct-booking shift from 12% to 20%; ₹72 lakh by eliminating response delays on wedding and offsite enquiries).  

**Supplementary Documentation:**
- [Technical Design Document](TECHNICAL_DESIGN.md)
- [Production Deployment Guide](deployment.md)

---

## 1. Project Overview & Business Value

Company A operates a 76-key coffee-estate resort in the Western Ghats of Chikkamagaluru, Karnataka. The business model currently suffers from two major inefficiencies:
1. **High OTA Commissions:** 68% of room nights flow through online travel agencies at 18–22% commission. Increasing direct bookings by 15% recovers ₹33.3 lakh annually.
2. **Event Enquiry Bottlenecks:** Approximately 90 event enquiries arrive monthly across disjointed channels (WhatsApp, email, web forms). Over 30% wait longer than 24 hours for a response, resulting in an estimated 3 lost events monthly at ₹2 lakh contribution (₹72 lakh annually).

This project delivers a high-performance direct-booking web application paired with an automated AI enquiry classification and routing engine.

---

## 2. Core Architecture & Engineering Decisions

### 2.1 Concurrency-Controlled Allotment Engine
- **Overbooking Prevention:** Direct website allotment (`webAllotment`) is strictly partitioned from agency allocations.
- **Transaction Isolation:** Bookings execute inside a serialized database transaction (`prisma.$transaction`). Availability is validated across every individual night of the requested date range before confirming inventory or recording payment.
- **Atomic Decrement:** Inventory availability cannot be decremented below zero, eliminating race conditions.

### 2.2 Dual-Mode AI Enquiry Router
- **Default In-Engine NLP (Zero Dependency):** A deterministic, sub-5ms classification and extraction pipeline using weighted domain dictionaries, entity heuristics, and regex parsers. Runs out of the box with zero third-party API dependencies or costs.
- **Optional LLM Integration:** Automatically activates Google Gemini 1.5 Flash when `GEMINI_API_KEY` is present in `.env.local`. If an external call times out (>4s) or encounters network failure, it fails over seamlessly to the local engine.

### 2.3 Policy Guardrails & Human-in-the-Loop Safeguards
- **Mandatory Review:** Draft replies are generated for review only; automated sending is disabled by design.
- **Rate Integrity:** Room rates are never hallucinated; pricing in drafts is referenced from the rate table.
- **Unsorted Lane for Ambiguity:** Classifications with confidence scores below 0.65 are tagged as Low Confidence and routed to the General Manager.
- **Escalation Rules:** Guest complaints automatically trigger high-priority GM alerts.
- **Single-Click Reassignment:** Staff can re-route any enquiry between departments in one click.

### 2.4 Statutory Compliance
- **Dynamic GST Engine:** Applies statutory Indian hospitality slabs: 12% for room tariffs up to ₹7,500; 18% for tariffs exceeding ₹7,500. Displayed transparently as `₹Base + ₹GST = ₹Total`.
- **DPDP Act 2023:** Data collection is minimal and transparent, with privacy notices across booking steps and footers.
- **Form C Protocol:** Foreign passport details are taken at physical check-in only, avoiding online storage of sensitive travel documents.

---

## 3. Screen Directory

The application comprises 8 core screens divided across guest and administrative workflows:

### Guest Experience
- **Home & Room Showcase (`/`):** Hero landscape imagery, estate overview, 6 room and villa categories (76 keys total), transparent pricing with tax breakdown, and Book Direct incentives.
- **Room Detail & Live Availability (`/rooms/[slug]`):** Photo galleries, amenity listings, and real-time interactive calendar checker with night-by-night pricing.
- **Three-Step Checkout & Confirmation (`/booking`):** Linear 3-step checkout (Dates -> Room -> Payment & Confirmation), promo code validation, mock payment gateway, and printable confirmation vouchers.
- **Weddings & Events Form (`/enquiry`):** Structured intake for weddings and corporate retreats, capturing guest counts (up to 300), date ranges, budgets, and operational requirements.

### Operations & Management
- **Bookings Dashboard & PMS Export (`/admin`):** Real-time arrival and departure counts, revenue metrics, filterable reservation ledger, and single-click daily CSV export for legacy PMS integration.
- **Rates & Allotment Matrix (`/admin/rates`):** 14-day calendar grid enabling dynamic daily rate adjustments, allotment allocation, and blackout toggles. Prevents allotment reduction below confirmed bookings.
- **Promo Code Manager (`/admin/promos`):** Management interface for percentage and flat discount codes, setting validity windows and usage thresholds.
- **Unified Enquiry Inbox (`/admin/inbox`):** Consolidated queue for all inbound channels with AI metadata tags, entity extraction summaries, drafted replies, and an interactive simulation modal.

---

## 4. Local Setup & Execution

### Prerequisites
- Node.js 18.x or 20.x
- npm or pnpm

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Database Setup & Seeding
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

The seed script loads:
- 6 Room Types totaling 76 keys (28 Deluxe Rooms, 24 Premium Rooms, 12 Suites, 6 Coffee Planter's Villas, 4 Heritage Villas, 2 Presidential Villas).
- 540 Daily inventory records spanning 90 days.
- 4 Staff user profiles (General Manager, Reservations Manager, Sales Manager, Front Office Manager).
- 4 Active promotional codes (`DIRECTFIRST`, `COFFEE15`, `LONGSTAY3K`, `WEDDING2027`).
- Seeded benchmark enquiries (`ENQ-4410` through `ENQ-4417`).

### Step 3: Run the Development Server
```bash
npm run dev
```

Access the application at `http://localhost:3000`.

---

## 5. Verification & Test Scenarios

To test the AI Enquiry Router, navigate to `http://localhost:3000/admin/inbox` and click **Simulate Incoming Enquiry**.

| Test Scenario | Sample Input Message | Expected Router Output |
|---|---|---|
| **Wedding Enquiry** | *"Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights"* | Category: Wedding (Confidence > 0.85)<br>Assigned: Sales Manager<br>Extracted: 250 guests, Feb 2027<br>Draft: Tailored wedding venue proposal request |
| **Room Reservation** | *"Is a villa free 14-16 Nov for 2 adults and a child?"* | Category: Room Booking (Confidence > 0.80)<br>Assigned: Reservations Manager<br>Extracted: 3 guests, 14–16 Nov<br>Draft: Villa availability and rate confirmation |
| **Corporate Offsite** | *"Team of 45 wants a January offsite with a conference hall"* | Category: Corporate Offsite (Confidence > 0.85)<br>Assigned: Sales Manager<br>Extracted: 45 guests, January<br>Draft: Conference package and breakout options |
| **Guest Complaint** | *"The AC in villa 3 stopped working at midnight and water leaked on the bed..."* | Category: Complaint (Confidence > 0.85)<br>Assigned: Front Office Manager<br>Flag: GM Alert Triggered<br>Draft: Prioritized management apology and resolution |
| **Ambiguous Message** | *"Hi, please send pictures and brochure."* | Category: General (Confidence < 0.65)<br>Assigned: General Manager<br>Flag: Low Confidence / Unsorted Lane |

---

## 6. Configuration (Optional)

To enable live Gemini LLM integration, create a `.env.local` file:

```env
# Optional: If omitted, the system defaults to the deterministic local NLP engine
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 7. Repository Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema definition
│   ├── seed.ts             # 76-key inventory and baseline seed data
│   └── dev.db              # SQLite development database file
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Screen 1: Home & Accommodation Showcase
│   │   ├── rooms/[slug]/page.tsx       # Screen 2: Room Detail & Real-Time Availability
│   │   ├── booking/                    # Screen 3: Three-Step Checkout & Confirmation
│   │   ├── enquiry/page.tsx            # Screen 4: Structured Event Enquiry Form
│   │   ├── admin/
│   │   │   ├── page.tsx                # Screen 5: Bookings Dashboard & PMS Export
│   │   │   ├── rates/page.tsx          # Screen 6: Rates & Allotment Matrix
│   │   │   ├── promos/page.tsx         # Screen 7: Promo Code Manager
│   │   │   └── inbox/page.tsx          # Screen 8: Unified AI Inbox & Simulator
│   │   └── api/                        # Next.js Server Route Handlers
│   ├── lib/
│   │   ├── ai-router.ts    # Dual-mode AI classification and drafting logic
│   │   ├── gst.ts          # Statutory GST tax calculation engine
│   │   ├── prisma.ts       # Database client connection singleton
│   │   └── utils.ts        # Formatting, currency, and date utilities
│   └── components/         # Reusable UI components
├── TECHNICAL_DESIGN.md     # Detailed Technical Design Document
├── deployment.md           # Production deployment instructions
└── README.md
```
