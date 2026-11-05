/**
 * Core Domain & AI Logic Test Suite
 * Run with: npx tsx scripts/test-core.ts
 */

import { calculateGST, calculateBookingTotalVariableRates } from '../src/lib/gst';
import { classifyEnquiry, extractEntities, assignOwner, draftReply } from '../src/lib/ai-router';
import { getDateRange, formatCurrency, generateBookingId, generateEnquiryId } from '../src/lib/utils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${details ? ` — ${details}` : ''}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('  RUNNING MISTY PEAKS ESTATE CORE TEST SUITE');
console.log('======================================================\n');

// ─── 1. GST Calculation Tests ──────────────────────────────────────────────────
console.log('1. Statutory GST Engine Tests (Indian Hospitality Slabs):');

// Slab 1: <= 7,500 -> 12% GST
const gstDeluxe = calculateGST(7500);
assert(gstDeluxe.rate === 0.12, 'Tariff of ₹7,500 incurs 12% GST');
assert(gstDeluxe.gstAmount === 900, 'Tariff of ₹7,500 incurs exactly ₹900 GST');
assert(gstDeluxe.totalWithGST === 8400, 'Tariff of ₹7,500 has total ₹8,400');

// Slab 2: > 7,500 -> 18% GST
const gstPremium = calculateGST(10000);
assert(gstPremium.rate === 0.18, 'Tariff of ₹10,000 incurs 18% GST');
assert(gstPremium.gstAmount === 1800, 'Tariff of ₹10,000 incurs exactly ₹1,800 GST');
assert(gstPremium.totalWithGST === 11800, 'Tariff of ₹10,000 has total ₹11,800');

// Boundary test: ₹7,501 -> 18%
const gstBoundary = calculateGST(7501);
assert(gstBoundary.rate === 0.18, 'Boundary tariff of ₹7,501 jumps to 18% GST');

// Multi-night variable rate booking (average tariff ₹8,750 > ₹7,500 -> 18% GST on total)
const variableTotal = calculateBookingTotalVariableRates([7500, 10000]);
assert(variableTotal.subtotal === 17500, 'Subtotal correctly sums ₹7,500 + ₹10,000 = ₹17,500');
assert(variableTotal.gstRate === 0.18, 'Average rate ₹8,750 correctly places booking in 18% GST bracket');
assert(variableTotal.gstAmount === 3150, 'GST correctly calculates 18% of ₹17,500 = ₹3,150');
assert(variableTotal.total === 20650, 'Total equals ₹17,500 + ₹3,150 = ₹20,650');

// ─── 2. AI Enquiry Router Tests ───────────────────────────────────────────────
console.log('\n2. AI Router Benchmark Classification & Entity Tests:');

// Benchmark ENQ-4410: Wedding
const enqWeddingMsg = "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights";
const classWedding = classifyEnquiry(enqWeddingMsg);
const entWedding = extractEntities(enqWeddingMsg);
const assignWedding = assignOwner(classWedding.category, classWedding.isLowConfidence);
assert(classWedding.category === 'wedding', 'ENQ-4410 classifies as wedding');
assert(classWedding.confidence >= 0.70, 'ENQ-4410 confidence is high (>= 0.70)');
assert(assignWedding.assignedTo === 'Sales Manager', 'ENQ-4410 assigned to Sales Manager');
assert(entWedding.guestCount === 250, 'ENQ-4410 extracts 250 guests');
assert(entWedding.dates.includes('Feb 2027'), 'ENQ-4410 extracts Feb 2027');

// Benchmark ENQ-4411: Room Booking
const enqRoomMsg = "Is a villa free 14-16 Nov for 2 adults and a child?";
const classRoom = classifyEnquiry(enqRoomMsg);
const entRoom = extractEntities(enqRoomMsg);
const assignRoom = assignOwner(classRoom.category, classRoom.isLowConfidence);
assert(classRoom.category === 'room_booking', 'ENQ-4411 classifies as room_booking');
assert(assignRoom.assignedTo === 'Reservations Manager', 'ENQ-4411 assigned to Reservations Manager');
assert(entRoom.guestCount === 3, 'ENQ-4411 extracts 3 guests (2 adults + child)');

// Benchmark ENQ-4412: Corporate Offsite
const enqOffsiteMsg = "Team of 45 wants a January offsite with a conference hall";
const classOffsite = classifyEnquiry(enqOffsiteMsg);
const entOffsite = extractEntities(enqOffsiteMsg);
const assignOffsite = assignOwner(classOffsite.category, classOffsite.isLowConfidence);
assert(classOffsite.category === 'corporate_offsite', 'ENQ-4412 classifies as corporate_offsite');
assert(assignOffsite.assignedTo === 'Sales Manager', 'ENQ-4412 assigned to Sales Manager');
assert(entOffsite.guestCount === 45, 'ENQ-4412 extracts 45 guests');

// Benchmark ENQ-4413: Guest Complaint with GM Alert
const enqComplaintMsg = "The room was dirty and AC was not working. Worst experience. I want a refund.";
const classComplaint = classifyEnquiry(enqComplaintMsg);
const assignComplaint = assignOwner(classComplaint.category, classComplaint.isLowConfidence);
assert(classComplaint.category === 'complaint', 'ENQ-4413 classifies as complaint');
assert(assignComplaint.alertGM === true, 'ENQ-4413 triggers mandatory GM alert');
assert(assignComplaint.assignedTo === 'Front Office Manager', 'ENQ-4413 assigned to Front Office Manager');

// Ambiguous message -> GM Unsorted Lane
const enqVagueMsg = "Hi, please send pictures and brochure.";
const classVague = classifyEnquiry(enqVagueMsg);
const assignVague = assignOwner(classVague.category, classVague.isLowConfidence);
assert(classVague.isLowConfidence === true, 'Vague message flags isLowConfidence: true');
assert(assignVague.assignedTo === 'General Manager', 'Vague message routes to GM Unsorted Lane');

// AI Safety Guardrail: Draft reply never invents pricing
const draft = draftReply('room_booking', entRoom, 'Vikram');
assert(!draft.includes('₹12,345'), 'Draft does not invent arbitrary room rates');
assert(draft.includes('rate table'), 'Draft includes disclaimer that rates come from rate table');
assert(draft.includes('[DRAFT'), 'Draft is explicitly marked as DRAFT (never auto-sent)');

// ─── 3. Domain Utilities & Concurrency Helpers ─────────────────────────────────
console.log('\n3. Domain Utilities & ID Generator Tests:');

const range = getDateRange('2026-11-14', '2026-11-16');
assert(range.length === 2, 'getDateRange for 2-night stay returns exactly 2 dates');
assert(range[0] === '2026-11-14' && range[1] === '2026-11-15', 'getDateRange produces correct ISO dates');

const bId = generateBookingId();
assert(bId.startsWith('BK-') && bId.length === 9, 'Booking ID matches BK-XXXXXX format');

const eId = generateEnquiryId();
assert(eId.startsWith('ENQ-') && eId.length === 8, 'Enquiry ID matches ENQ-XXXX format');

const formattedInr = formatCurrency(15000);
assert(formattedInr.includes('15,000'), 'Currency formats with Indian commas');

console.log('\n======================================================');
console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
