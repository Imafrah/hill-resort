/**
 * GST Calculation Utility for Indian Hotel Tariffs
 * 
 * GST Rates (as per GST Council):
 * - Room tariff ≤ ₹7,500/night → 12% GST
 * - Room tariff > ₹7,500/night → 18% GST
 */

export interface GSTResult {
  rate: 0.12 | 0.18;
  gstAmount: number;
  totalWithGST: number;
  description: string;
}

export interface BookingTotal {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  breakdown: string;
}

/**
 * Calculate GST for a single night's tariff.
 */
export function calculateGST(tariffPerNight: number): GSTResult {
  const rate = tariffPerNight <= 7500 ? 0.12 : 0.18;
  const gstAmount = Math.round(tariffPerNight * rate);
  const totalWithGST = tariffPerNight + gstAmount;
  const pct = rate === 0.12 ? '12%' : '18%';

  return {
    rate,
    gstAmount,
    totalWithGST,
    description: `₹${tariffPerNight.toLocaleString('en-IN')} + ${pct} GST (₹${gstAmount.toLocaleString('en-IN')}) = ₹${totalWithGST.toLocaleString('en-IN')}`,
  };
}

/**
 * Calculate the total for a multi-night booking, including optional discount.
 */
export function calculateBookingTotal(
  ratePerNight: number,
  nights: number,
  discountAmount: number = 0
): BookingTotal {
  const subtotal = ratePerNight * nights;
  const discount = Math.min(discountAmount, subtotal); // Can't discount more than subtotal
  const taxableAmount = subtotal - discount;
  const gstRate = ratePerNight <= 7500 ? 0.12 : 0.18;
  const gstAmount = Math.round(taxableAmount * gstRate);
  const total = taxableAmount + gstAmount;
  const pct = gstRate === 0.12 ? '12%' : '18%';

  const breakdown = [
    `Room charges: ₹${ratePerNight.toLocaleString('en-IN')} × ${nights} night${nights > 1 ? 's' : ''} = ₹${subtotal.toLocaleString('en-IN')}`,
    discount > 0 ? `Discount: -₹${discount.toLocaleString('en-IN')}` : null,
    `Taxable amount: ₹${taxableAmount.toLocaleString('en-IN')}`,
    `GST @ ${pct}: ₹${gstAmount.toLocaleString('en-IN')}`,
    `Total: ₹${total.toLocaleString('en-IN')}`,
  ].filter(Boolean).join('\n');

  return { subtotal, discount, taxableAmount, gstRate, gstAmount, total, breakdown };
}

/**
 * Calculate total for a booking with varying nightly rates.
 */
export function calculateBookingTotalVariableRates(
  nightlyRates: number[],
  discountAmount: number = 0
): BookingTotal {
  const subtotal = nightlyRates.reduce((sum, r) => sum + r, 0);
  const discount = Math.min(discountAmount, subtotal);
  const taxableAmount = subtotal - discount;
  
  // Use the average rate to determine GST slab
  const avgRate = subtotal / nightlyRates.length;
  const gstRate = avgRate <= 7500 ? 0.12 : 0.18;
  const gstAmount = Math.round(taxableAmount * gstRate);
  const total = taxableAmount + gstAmount;
  const pct = gstRate === 0.12 ? '12%' : '18%';

  const breakdown = [
    `Room charges: ₹${subtotal.toLocaleString('en-IN')} (${nightlyRates.length} night${nightlyRates.length > 1 ? 's' : ''})`,
    discount > 0 ? `Discount: -₹${discount.toLocaleString('en-IN')}` : null,
    `Taxable amount: ₹${taxableAmount.toLocaleString('en-IN')}`,
    `GST @ ${pct}: ₹${gstAmount.toLocaleString('en-IN')}`,
    `Total: ₹${total.toLocaleString('en-IN')}`,
  ].filter(Boolean).join('\n');

  return { subtotal, discount, taxableAmount, gstRate, gstAmount, total, breakdown };
}
