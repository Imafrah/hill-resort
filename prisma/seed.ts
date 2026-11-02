import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helper: generate dates ──────────────────────────────────────────────────

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateString: string, days: number): string {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function isWeekend(dateString: string): boolean {
  const d = new Date(dateString);
  const day = d.getDay();
  return day === 0 || day === 5 || day === 6; // Fri, Sat, Sun
}

// ─── Room Types ──────────────────────────────────────────────────────────────

const roomTypes = [
  {
    name: 'Deluxe Room',
    slug: 'deluxe-room',
    description: 'Nestled among the coffee plantations, our Deluxe Rooms offer a serene retreat with panoramic views of the Western Ghats. Wake to birdsong, sip estate-grown coffee on your private balcony, and let the mist-wrapped hills set the pace of your day. Each room features handcrafted wooden furniture, locally sourced textiles, and modern comforts.',
    shortDesc: 'Plantation views, private balcony, estate-grown coffee',
    baseRate: 7500,
    weekendRate: 9750,
    maxGuests: 2,
    totalInventory: 28,
    bedType: 'King',
    sizeSqFt: 350,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Tea/Coffee Maker', 'Rain Shower', 'Balcony', 'Mountain View', 'Room Service']),
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d955c4644?w=800&q=80',
    ]),
    category: 'room',
    sortOrder: 1,
  },
  {
    name: 'Premium Room',
    slug: 'premium-room',
    description: 'Elevated comfort in the heart of the estate. Premium Rooms are larger sanctuaries with sitting areas that open to uninterrupted valley views. The interiors marry plantation heritage with contemporary elegance — think antique coffee chests, cane armchairs and rainfall showers. Ideal for couples seeking quiet luxury.',
    shortDesc: 'Valley views, sitting area, heritage-meets-modern interiors',
    baseRate: 10000,
    weekendRate: 13000,
    maxGuests: 3,
    totalInventory: 24,
    bedType: 'King',
    sizeSqFt: 480,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Tea/Coffee Maker', 'Rain Shower', 'Balcony', 'Valley View', 'Room Service', 'Sitting Area', 'Bathrobe & Slippers']),
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    ]),
    category: 'room',
    sortOrder: 2,
  },
  {
    name: 'Suite',
    slug: 'suite',
    description: 'A generous one-bedroom suite where indoor and outdoor living merge. The separate living room features a writing desk and a daybed by floor-to-ceiling windows; the bedroom opens to a deep-soaking tub and a private deck overlooking the coffee canopy. Curated for those who want to slow down without giving up refinement.',
    shortDesc: 'Separate living room, soaking tub, private deck',
    baseRate: 18000,
    weekendRate: 23400,
    maxGuests: 3,
    totalInventory: 12,
    bedType: 'King',
    sizeSqFt: 720,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Espresso Machine', 'Rain Shower', 'Soaking Tub', 'Private Deck', 'Valley View', 'Room Service', 'Living Room', 'Bathrobe & Slippers', 'Turndown Service']),
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
    ]),
    category: 'room',
    sortOrder: 3,
  },
  {
    name: "Coffee Planter's Villa",
    slug: 'coffee-planters-villa',
    description: "Step into a restored planter's bungalow surrounded by arabica coffee bushes. Each villa has two bedrooms, a verandah with cane loungers, a private garden and an outdoor shower hidden among frangipani trees. Original tile floors, plantation-era furniture and a personal butler make this a stay that feels inherited rather than rented.",
    shortDesc: '2-bed villa, private garden, personal butler',
    baseRate: 25000,
    weekendRate: 32500,
    maxGuests: 4,
    totalInventory: 6,
    bedType: 'King + Twin',
    sizeSqFt: 1200,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Full Mini Bar', 'Espresso Machine', 'Rain Shower', 'Outdoor Shower', 'Private Garden', 'Verandah', 'Butler Service', 'Fireplace', 'Valley View', 'BBQ Area']),
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    ]),
    category: 'villa',
    sortOrder: 4,
  },
  {
    name: 'Heritage Villa',
    slug: 'heritage-villa',
    description: 'A two-storey heritage bungalow dating back to the 1940s, painstakingly restored with original Mangalore-tile roofs, arched windows and teak woodwork. Three bedrooms across two floors, a private plunge pool, and a dining verandah where the chef serves a bespoke menu. Perfect for families or small celebrations.',
    shortDesc: '3-bed heritage bungalow, plunge pool, private chef',
    baseRate: 32000,
    weekendRate: 41600,
    maxGuests: 6,
    totalInventory: 4,
    bedType: '2 King + 2 Twin',
    sizeSqFt: 1800,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Full Mini Bar', 'Espresso Machine', 'Plunge Pool', 'Private Chef', 'Dining Verandah', 'Butler Service', 'Fireplace', 'Garden', '3 Bedrooms', 'Library']),
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    ]),
    category: 'villa',
    sortOrder: 5,
  },
  {
    name: 'Presidential Villa',
    slug: 'presidential-villa',
    description: 'The crown of the estate. This standalone four-bedroom villa sits at the highest point, with 270-degree views from Mullayanagiri to the Baba Budangiri range. An infinity pool, a private spa room, a home cinema and a fully equipped kitchen let you host in grand style without stepping outside. The ultimate address in Chikkamagaluru.',
    shortDesc: '4-bed summit villa, infinity pool, spa, cinema',
    baseRate: 45000,
    weekendRate: 58500,
    maxGuests: 8,
    totalInventory: 2,
    bedType: '3 King + 2 Twin',
    sizeSqFt: 3000,
    amenities: JSON.stringify(['Wi-Fi', 'Air Conditioning', 'Premium Bar', 'Espresso Machine', 'Infinity Pool', 'Private Spa', 'Home Cinema', 'Full Kitchen', 'Butler Service', 'Fireplace', '4 Bedrooms', '360° Views', 'Helipad Access']),
    photos: JSON.stringify([
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    ]),
    category: 'villa',
    sortOrder: 6,
  },
];

// ─── Staff ───────────────────────────────────────────────────────────────────

const staff = [
  {
    name: 'Rajesh Hegde',
    email: 'gm@mistypeaks.in',
    phone: '+91 98765 43210',
    role: 'gm',
    title: 'General Manager',
    password: 'admin123', // In production, this would be hashed
  },
  {
    name: 'Priya Sharma',
    email: 'reservations@mistypeaks.in',
    phone: '+91 98765 43211',
    role: 'reservations_manager',
    title: 'Reservations Manager',
    password: 'admin123',
  },
  {
    name: 'Arun Kumar',
    email: 'sales@mistypeaks.in',
    phone: '+91 98765 43212',
    role: 'sales_manager',
    title: 'Sales Manager',
    password: 'admin123',
  },
  {
    name: 'Meera Nair',
    email: 'frontoffice@mistypeaks.in',
    phone: '+91 98765 43213',
    role: 'front_office',
    title: 'Front Office Manager',
    password: 'admin123',
  },
];

// ─── Promo Codes ─────────────────────────────────────────────────────────────

const promoCodes = [
  {
    code: 'DIRECTFIRST',
    description: 'First direct booking discount - 10% off',
    discountType: 'percentage',
    discountValue: 10,
    validFrom: '2026-11-01',
    validTo: '2027-03-31',
    maxUses: 500,
  },
  {
    code: 'COFFEE15',
    description: 'Coffee season special - 15% off villas',
    discountType: 'percentage',
    discountValue: 15,
    validFrom: '2026-12-01',
    validTo: '2027-02-28',
    maxUses: 50,
  },
  {
    code: 'LONGSTAY3K',
    description: '₹3,000 off on stays of 3+ nights',
    discountType: 'flat',
    discountValue: 3000,
    validFrom: '2026-11-01',
    validTo: '2027-06-30',
    maxUses: 200,
  },
  {
    code: 'WEDDING2027',
    description: 'Wedding season 2027 - 5% off room block',
    discountType: 'percentage',
    discountValue: 5,
    validFrom: '2027-01-01',
    validTo: '2027-06-30',
    maxUses: 20,
  },
];

// ─── Sample Enquiries ────────────────────────────────────────────────────────

const enquiries = [
  {
    enquiryId: 'ENQ-4410',
    source: 'whatsapp',
    guestName: 'Deepa Rao',
    guestEmail: 'deepa.rao@email.com',
    guestPhone: '+91 99887 76655',
    message: 'Venue for my sister\'s wedding in Feb 2027, about 250 guests, 2 nights',
    category: 'wedding',
    confidence: 0.92,
    isLowConfidence: false,
    extractedDates: JSON.stringify(['Feb 2027']),
    extractedGuests: 250,
    extractedBudget: null,
    assignedTo: 'Sales Manager',
    alertGM: false,
    aiDraft: 'Dear Deepa,\n\nThank you for considering Misty Peaks Estate for your sister\'s wedding! We would be delighted to host this special celebration.\n\nOur estate can comfortably accommodate up to 300 guests across our landscaped lawns and indoor banquet spaces. For a February 2027 wedding over 2 nights, we have several beautiful venue options.\n\nCould you share a few more details so we can put together a personalised proposal?\n- Preferred dates in February 2027\n- Style of wedding (indoor/outdoor/both)\n- Any specific requirements (mandap, mehendi area, etc.)\n- Accommodation needs for guests\n\nOur Sales Manager, Arun, will reach out to you shortly to discuss the details.\n\nWarm regards,\nTeam Misty Peaks Estate',
    status: 'new',
  },
  {
    enquiryId: 'ENQ-4411',
    source: 'web_form',
    guestName: 'Vikram Singh',
    guestEmail: 'vikram.s@email.com',
    guestPhone: '+91 88776 65544',
    message: 'Is a villa free 14-16 Nov for 2 adults and a child?',
    category: 'room_booking',
    confidence: 0.85,
    isLowConfidence: false,
    extractedDates: JSON.stringify(['14 Nov', '16 Nov']),
    extractedGuests: 3,
    extractedBudget: null,
    assignedTo: 'Reservations Manager',
    alertGM: false,
    aiDraft: 'Dear Vikram,\n\nThank you for your interest in staying at Misty Peaks Estate!\n\nWe are checking villa availability for 14–16 November for 2 adults and 1 child. Our villas are perfect for families, offering private gardens and spacious living areas.\n\nOur Reservations Manager, Priya, will confirm availability and share the best rates for your dates shortly.\n\nWe look forward to welcoming you to the hills!\n\nWarm regards,\nTeam Misty Peaks Estate',
    status: 'new',
  },
  {
    enquiryId: 'ENQ-4412',
    source: 'email',
    guestName: 'Ananya Deshmukh',
    guestEmail: 'ananya.d@techcorp.com',
    guestPhone: '+91 77665 54433',
    message: 'Team of 45 wants a January offsite with a conference hall',
    category: 'corporate_offsite',
    confidence: 0.88,
    isLowConfidence: false,
    extractedDates: JSON.stringify(['January']),
    extractedGuests: 45,
    extractedBudget: null,
    assignedTo: 'Sales Manager',
    alertGM: false,
    aiDraft: 'Dear Ananya,\n\nThank you for considering Misty Peaks Estate for your team offsite!\n\nWe regularly host corporate retreats and have excellent facilities for a group of 45:\n- Conference hall with AV equipment, projector and sound system\n- Breakout rooms for smaller group sessions\n- Team-building activities: coffee plantation walks, trekking, bonfire evenings\n- Dedicated event coordinator\n\nCould you let us know:\n- Preferred dates in January\n- Number of days/nights\n- Any specific requirements (dietary, activities, presentation setup)\n\nOur Sales Manager, Arun, will prepare a customised proposal for your team.\n\nBest regards,\nTeam Misty Peaks Estate',
    status: 'new',
  },
  {
    enquiryId: 'ENQ-4413',
    source: 'web_form',
    guestName: 'Rahul Menon',
    guestEmail: 'rahul.m@email.com',
    guestPhone: '+91 99001 12233',
    message: 'The room was dirty and AC was not working. Worst experience. I want a refund.',
    category: 'complaint',
    confidence: 0.95,
    isLowConfidence: false,
    extractedDates: JSON.stringify([]),
    extractedGuests: null,
    extractedBudget: null,
    assignedTo: 'Front Office Manager',
    alertGM: true,
    aiDraft: 'Dear Rahul,\n\nWe sincerely apologise for the experience you had at Misty Peaks Estate. This falls far below the standards we hold ourselves to, and we take your feedback very seriously.\n\nOur Front Office Manager, Meera, is looking into this matter personally and will contact you within the next few hours to understand the full details and resolve this to your satisfaction.\n\nWe deeply value your feedback as it helps us improve.\n\nWith sincere apologies,\nTeam Misty Peaks Estate',
    status: 'new',
  },
  {
    enquiryId: 'ENQ-4414',
    source: 'whatsapp',
    guestName: 'Sunita Patil',
    guestEmail: 'sunita.p@email.com',
    guestPhone: '+91 88990 01122',
    message: 'What time is check-in? Also do you have a swimming pool?',
    category: 'general',
    confidence: 0.42,
    isLowConfidence: true,
    extractedDates: JSON.stringify([]),
    extractedGuests: null,
    extractedBudget: null,
    assignedTo: 'General Manager',
    alertGM: true,
    aiDraft: 'Dear Sunita,\n\nThank you for reaching out to Misty Peaks Estate!\n\nCheck-in time is 2:00 PM and check-out is 11:00 AM. Yes, we do have a temperature-controlled swimming pool with a stunning view of the hills, open from 7:00 AM to 7:00 PM.\n\nWould you like to make a reservation? We would be happy to help!\n\nWarm regards,\nTeam Misty Peaks Estate',
    status: 'new',
  },
  {
    enquiryId: 'ENQ-4415',
    source: 'email',
    guestName: 'Karthik Iyer',
    guestEmail: 'karthik.i@email.com',
    guestPhone: '+91 77880 09911',
    message: 'Looking for a premium room for our anniversary, Dec 24-26. Budget around 30k for the stay. Any special packages?',
    category: 'room_booking',
    confidence: 0.78,
    isLowConfidence: false,
    extractedDates: JSON.stringify(['Dec 24', 'Dec 26']),
    extractedGuests: 2,
    extractedBudget: '₹30,000',
    assignedTo: 'Reservations Manager',
    alertGM: false,
    aiDraft: 'Dear Karthik,\n\nHappy anniversary! What a wonderful way to celebrate — among the misty hills and coffee blossoms.\n\nWe are checking our Premium Room availability for December 24–26 and will share the best options within your budget. We also have special anniversary touches we can arrange — cake, room decoration, a couples\' spa session, or a private dinner under the stars.\n\nOur Reservations Manager, Priya, will get back to you shortly with availability and a personalised package.\n\nWarm regards,\nTeam Misty Peaks Estate',
    status: 'new',
  },
  {
    enquiryId: 'ENQ-4416',
    source: 'whatsapp',
    guestName: 'Fatima Begum',
    guestEmail: 'fatima.b@email.com',
    guestPhone: '+91 99112 23344',
    message: 'Nikah ceremony for 150 guests in March. Need halal catering and separate arrangements for ladies. Budget 20 lakh.',
    category: 'wedding',
    confidence: 0.94,
    isLowConfidence: false,
    extractedDates: JSON.stringify(['March']),
    extractedGuests: 150,
    extractedBudget: '₹20 lakh',
    assignedTo: 'Sales Manager',
    alertGM: false,
    aiDraft: 'Dear Fatima,\n\nThank you for considering Misty Peaks Estate for your Nikah ceremony. We would be honoured to host this beautiful celebration.\n\nWe can certainly accommodate 150 guests and have experience hosting ceremonies with specific cultural requirements. We can arrange:\n- Halal catering with our partner caterers\n- Separate spaces for ladies\' gatherings\n- Beautifully decorated ceremony area\n- Accommodation for guests\n\nOur Sales Manager, Arun, will contact you to discuss the details and prepare a proposal within your budget.\n\nWarm regards,\nTeam Misty Peaks Estate',
    status: 'new',
  },
  {
    enquiryId: 'ENQ-4417',
    source: 'web_form',
    guestName: 'Arjun Reddy',
    guestEmail: 'arjun.r@startupco.in',
    guestPhone: '+91 88001 12200',
    message: 'Planning a 3-day leadership retreat for 20 senior managers. Need good connectivity, meeting rooms and some adventure activities. First week of February.',
    category: 'corporate_offsite',
    confidence: 0.86,
    isLowConfidence: false,
    extractedDates: JSON.stringify(['First week of February']),
    extractedGuests: 20,
    extractedBudget: null,
    assignedTo: 'Sales Manager',
    alertGM: false,
    aiDraft: 'Dear Arjun,\n\nMisty Peaks Estate is an ideal setting for leadership retreats — the serene environment and mountain air do wonders for strategic thinking!\n\nFor your group of 20 senior managers over 3 days, we can offer:\n- Dedicated conference room with high-speed Wi-Fi, projector and whiteboard\n- Breakout spaces for smaller discussions\n- Adventure activities: guided treks, coffee plantation tours, rappelling, kayaking\n- Evening bonfire sessions\n- Premium accommodation\n\nOur Sales Manager, Arun, will reach out to discuss dates in the first week of February and craft a tailored proposal.\n\nBest regards,\nTeam Misty Peaks Estate',
    status: 'in_progress',
  },
];

// ─── Sample Bookings ─────────────────────────────────────────────────────────

const bookings = [
  {
    bookingId: 'BK-100001',
    guestName: 'Neha Gupta',
    email: 'neha.g@email.com',
    phone: '+91 99887 11223',
    checkIn: '2026-11-14',
    checkOut: '2026-11-16',
    nights: 2,
    adults: 2,
    children: 0,
    roomCharges: 20000,
    discount: 0,
    taxableAmount: 20000,
    gstRate: 0.18,
    gstAmount: 3600,
    totalAmount: 23600,
    paymentId: 'pay_test_001',
    paymentStatus: 'paid',
    status: 'confirmed',
    roomTypeSlug: 'premium-room',
  },
  {
    bookingId: 'BK-100002',
    guestName: 'Suresh Nambiar',
    email: 'suresh.n@email.com',
    phone: '+91 88776 00112',
    checkIn: '2026-11-20',
    checkOut: '2026-11-23',
    nights: 3,
    adults: 4,
    children: 2,
    roomCharges: 96000,
    discount: 3000,
    taxableAmount: 93000,
    gstRate: 0.18,
    gstAmount: 16740,
    totalAmount: 109740,
    paymentId: 'pay_test_002',
    paymentStatus: 'paid',
    status: 'confirmed',
    roomTypeSlug: 'heritage-villa',
    promoCode: 'LONGSTAY3K',
  },
];

// ─── Seed Function ───────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Misty Peaks Estate database...\n');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.dailyInventory.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.roomType.deleteMany();

  // ── Seed Room Types ──
  console.log('🏨 Creating room types...');
  const createdRoomTypes: Record<string, string> = {};
  for (const rt of roomTypes) {
    const created = await prisma.roomType.create({ data: rt });
    createdRoomTypes[rt.slug] = created.id;
    console.log(`   ✓ ${rt.name} (${rt.totalInventory} units, ₹${rt.baseRate.toLocaleString('en-IN')}/night)`);
  }

  // ── Seed Daily Inventory (90 days from today) ──
  console.log('\n📅 Generating 90-day inventory...');
  const today = new Date().toISOString().split('T')[0];
  let inventoryCount = 0;

  for (const rt of roomTypes) {
    const roomTypeId = createdRoomTypes[rt.slug];
    // Allocate ~50% of physical inventory to website
    const webAllotment = Math.ceil(rt.totalInventory * 0.5);

    for (let i = 0; i < 90; i++) {
      const date = addDays(today, i);
      const weekend = isWeekend(date);
      const rate = weekend ? rt.weekendRate : rt.baseRate;

      // Some dates have special pricing or blackouts
      const isChristmasNewYear = date >= '2026-12-24' && date <= '2027-01-02';
      const finalRate = isChristmasNewYear ? Math.round(rate * 1.25) : rate; // 25% premium for holidays

      await prisma.dailyInventory.create({
        data: {
          roomTypeId,
          date,
          rate: finalRate,
          webAllotment: isChristmasNewYear ? Math.ceil(webAllotment * 0.7) : webAllotment, // Fewer rooms on holidays
          booked: 0,
          isBlackout: false,
        },
      });
      inventoryCount++;
    }
  }
  console.log(`   ✓ ${inventoryCount} inventory records created`);

  // ── Seed Staff ──
  console.log('\n👥 Creating staff accounts...');
  for (const s of staff) {
    await prisma.staff.create({ data: s });
    console.log(`   ✓ ${s.name} — ${s.title}`);
  }

  // ── Seed Promo Codes ──
  console.log('\n🏷️  Creating promo codes...');
  const createdPromos: Record<string, string> = {};
  for (const p of promoCodes) {
    const created = await prisma.promoCode.create({ data: p });
    createdPromos[p.code] = created.id;
    console.log(`   ✓ ${p.code} — ${p.description}`);
  }

  // ── Seed Enquiries ──
  console.log('\n📬 Creating sample enquiries...');
  for (const e of enquiries) {
    await prisma.enquiry.create({ data: e });
    console.log(`   ✓ ${e.enquiryId} — ${e.category} (${e.source})`);
  }

  // ── Seed Bookings ──
  console.log('\n📋 Creating sample bookings...');
  for (const b of bookings) {
    const roomTypeId = createdRoomTypes[b.roomTypeSlug];
    const promoCodeId = b.promoCode ? createdPromos[b.promoCode] : undefined;

    await prisma.booking.create({
      data: {
        bookingId: b.bookingId,
        guestName: b.guestName,
        email: b.email,
        phone: b.phone,
        roomTypeId,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.nights,
        adults: b.adults,
        children: b.children,
        roomCharges: b.roomCharges,
        discount: b.discount,
        taxableAmount: b.taxableAmount,
        gstRate: b.gstRate,
        gstAmount: b.gstAmount,
        totalAmount: b.totalAmount,
        paymentId: b.paymentId,
        paymentStatus: b.paymentStatus,
        status: b.status,
        promoCodeId: promoCodeId,
      },
    });

    // Update inventory for booked dates
    let currentDate = b.checkIn;
    while (currentDate < b.checkOut) {
      await prisma.dailyInventory.updateMany({
        where: { roomTypeId, date: currentDate },
        data: { booked: { increment: 1 } },
      });
      currentDate = addDays(currentDate, 1);
    }
    console.log(`   ✓ ${b.bookingId} — ${b.guestName} (${b.checkIn} to ${b.checkOut})`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('📊 Summary:');
  console.log(`   Room Types: ${roomTypes.length}`);
  console.log(`   Inventory Records: ${inventoryCount}`);
  console.log(`   Staff: ${staff.length}`);
  console.log(`   Promo Codes: ${promoCodes.length}`);
  console.log(`   Enquiries: ${enquiries.length}`);
  console.log(`   Bookings: ${bookings.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

