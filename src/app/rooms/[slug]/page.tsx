import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import GuestHeader from '@/components/guest/Header';
import GuestFooter from '@/components/guest/Footer';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { calculateGST } from '@/lib/gst';
import AvailabilityChecker from './AvailabilityChecker';
import { Users, Maximize, Bed, ChevronLeft, Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const room = await prisma.roomType.findUnique({ where: { slug } });
  if (!room) notFound();

  const photos = JSON.parse(room.photos) as string[];
  const amenities = JSON.parse(room.amenities) as string[];
  const gst = calculateGST(room.baseRate);

  return (
    <>
      <GuestHeader />

      <div className="pt-20 lg:pt-24 bg-[var(--cream)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/#rooms" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--forest)] transition-colors">
            <ChevronLeft className="w-4 h-4" /> All Rooms &amp; Villas
          </Link>
        </div>
      </div>

      {/* Photo Gallery */}
      <section className="bg-[var(--cream)] pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
            <div className="lg:col-span-2 relative aspect-[16/10] rounded-sm overflow-hidden">
              <Image src={photos[0]} alt={room.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 66vw" />
            </div>
            <div className="hidden lg:grid grid-rows-2 gap-3">
              {photos.slice(1, 3).map((photo, i) => (
                <div key={i} className="relative aspect-[4/3] rounded-sm overflow-hidden">
                  <Image src={photo} alt={`${room.name} view ${i + 2}`} fill className="object-cover" sizes="33vw" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Room Details */}
      <section className="py-12 lg:py-16 bg-[var(--cream)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
            <div className="lg:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--coffee)]">{room.category}</span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] mb-4 mt-2">{room.name}</h1>

              <div className="flex flex-wrap gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-stone-200">
                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[var(--gold)]" /> Up to {room.maxGuests} guests</span>
                <span className="flex items-center gap-2"><Maximize className="w-4 h-4 text-[var(--gold)]" /> {room.sizeSqFt} sq ft</span>
                <span className="flex items-center gap-2"><Bed className="w-4 h-4 text-[var(--gold)]" /> {room.bedType}</span>
              </div>

              <p className="text-gray-600 leading-relaxed mb-10">{room.description}</p>

              <h3 className="font-serif text-xl text-[var(--forest)] mb-4">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-[var(--forest)] shrink-0" /> {amenity}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Card */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-stone-200 p-6 lg:p-8 sticky top-24 rounded-sm shadow-sm">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-semibold text-[var(--forest)]">{formatCurrency(room.baseRate)}</span>
                    <span className="text-sm text-gray-400">/ night</span>
                  </div>
                  <p className="text-xs text-gray-400">{gst.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Weekend rate: {formatCurrency(room.weekendRate)}/night</p>
                </div>
                <AvailabilityChecker roomTypeId={room.id} roomSlug={room.slug} roomName={room.name} maxGuests={room.maxGuests} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <GuestFooter />
    </>
  );
}
