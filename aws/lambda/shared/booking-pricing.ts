export const DEFAULT_ADDITIONAL_PET_RATE = 0.4;

export interface BookingPricingInput {
  bookingType: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  pricePerHour: number;
  hours?: number;
  petCount: number;
  additionalPetRate?: number;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateBookingPricing(input: BookingPricingInput) {
  const additionalPetRate = input.additionalPetRate ?? DEFAULT_ADDITIONAL_PET_RATE;
  const petCount = Math.max(1, input.petCount);
  const unitCount =
    input.bookingType === 'overnight'
      ? Math.max(
          1,
          Math.floor(
            (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : Math.max(1, input.hours ?? 1);

  const unitPrice = input.bookingType === 'overnight' ? input.pricePerNight : input.pricePerHour;
  const baseSubtotal = roundCurrency(unitPrice * unitCount);
  const additionalPetFee =
    petCount > 1 ? roundCurrency(baseSubtotal * additionalPetRate * (petCount - 1)) : 0;
  const subtotal = roundCurrency(baseSubtotal + additionalPetFee);
  const serviceFee = roundCurrency(subtotal * 0.1);
  const totalPrice = roundCurrency(subtotal + serviceFee);

  return {
    unitCount,
    baseSubtotal,
    additionalPetFee,
    subtotal,
    serviceFee,
    totalPrice,
    additionalPetRate,
  };
}
