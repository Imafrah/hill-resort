import Link from 'next/link';
import Image from 'next/image';
import GuestHeader from '@/components/guest/Header';
import GuestFooter from '@/components/guest/Footer';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { calculateGST } from '@/lib/gst';
import { Users, Maximize, Coffee, Mountain, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const roomTypes = await prisma.roomType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <>
      <GuestHeader />

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="relative h-[90vh] min-h-[600px] flex items-end">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
            alt="Misty mountain views from Misty Peaks Estate"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-28 w-full">
          <p className="text-[var(--gold)] text-xs uppercase tracking-[0.3em] mb-4">
            Chikkamagaluru, Western Ghats
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white max-w-3xl leading-[1.1] mb-6">
            Where mist meets coffee, and time slows down
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
            A 76-key coffee-estate resort among arabica plantations, with panoramic
            views of the Mullayanagiri and Baba Budangiri ranges.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#rooms" className="bg-[var(--gold)] text-[var(--forest-dark)] px-8 py-3.5 text-sm font-medium tracking-wide hover:bg-[var(--gold-light)] transition-colors rounded-sm">
              View Rooms &amp; Rates
            </a>
            <Link href="/enquiry" className="border border-white/30 text-white px-8 py-3.5 text-sm tracking-wide hover:bg-white/10 transition-colors rounded-sm">
              Plan an Event
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Book Direct Strip ─────────────────────────────────────── */}
      <section className="bg-[var(--forest)] text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-[var(--gold)]" />
            <span>Book direct &amp; save up to 20% on agency rates</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-[var(--gold)]" />
            <span>Best rate guarantee • Free cancellation 48h before</span>
          </div>
        </div>
      </section>

      {/* ─── Rooms & Villas ────────────────────────────────────────── */}
      <section id="rooms" className="py-20 lg:py-28 bg-[var(--cream)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[var(--coffee)] text-xs uppercase tracking-[0.3em] mb-3">Accommodation</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[var(--forest)]">Rooms &amp; Villas</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              From intimate rooms overlooking the plantations to sprawling private villas with their own pools and butlers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {roomTypes.map((room) => {
              const photos = JSON.parse(room.photos) as string[];
              const amenities = (JSON.parse(room.amenities) as string[]).slice(0, 4);
              const gst = calculateGST(room.baseRate);

              return (
                <Link
                  key={room.id}
                  href={`/rooms/${room.slug}`}
                  className="group bg-white border border-stone-200 hover:border-[var(--gold)]/40 transition-all duration-300 flex flex-col rounded-sm overflow-hidden shadow-sm hover:shadow-md"
                >
                  {/* Photo */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={photos[0]}
                      alt={room.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[var(--forest)]/90 text-white text-xs uppercase tracking-wider px-3 py-1 rounded-sm">
                        {room.category}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 lg:p-6 flex flex-col flex-1">
                    <h3 className="font-serif text-xl text-[var(--forest)] mb-1.5">{room.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{room.shortDesc}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Up to {room.maxGuests}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize className="w-3.5 h-3.5" /> {room.sizeSqFt} sq ft
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {amenities.map((a) => (
                        <span key={a} className="text-xs bg-stone-100 text-gray-500 px-2 py-0.5 rounded">
                          {a}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-stone-200 flex items-end justify-between">
                      <div>
                        <span className="text-lg font-semibold text-[var(--forest)]">
                          {formatCurrency(room.baseRate)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">/ night</span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          + {gst.rate === 0.12 ? '12%' : '18%'} GST
                        </p>
                      </div>
                      <span className="text-sm text-[var(--gold)] flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                        View <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── About / Estate ───────────────────────────────────────── */}
      <section id="about" className="py-20 bg-[var(--forest)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[var(--gold)] text-xs uppercase tracking-[0.3em] mb-3">The Estate</p>
              <h2 className="font-serif text-3xl sm:text-4xl mb-6 leading-tight">
                A living heritage among the clouds
              </h2>
              <div className="space-y-4 text-white/70 text-sm leading-relaxed">
                <p>
                  Spread across 200 acres of arabica and robusta coffee plantations,
                  Misty Peaks Estate sits at 1,200 metres in the Western Ghats —
                  where the morning mist rolls in from the Baba Budangiri range.
                </p>
                <p>
                  The estate was founded in 1920 and has been restored into a 76-key resort
                  that balances plantation heritage with contemporary comfort.
                </p>
                <p>
                  Our lawns and heritage halls host up to 300 guests for weddings,
                  and our conference facilities are a favourite for leadership retreats.
                  The estate is a 4-hour drive from Bengaluru.
                </p>
              </div>
              <Link href="/enquiry" className="inline-block mt-8 bg-[var(--gold)] text-[var(--forest-dark)] px-8 py-3.5 text-sm font-medium tracking-wide hover:bg-[var(--gold-light)] transition-colors rounded-sm">
                Plan Your Event
              </Link>
            </div>
            <div className="relative aspect-[4/3] lg:aspect-square rounded-sm overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80"
                alt="Coffee plantation at Misty Peaks Estate"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <GuestFooter />
    </>
  );
}
