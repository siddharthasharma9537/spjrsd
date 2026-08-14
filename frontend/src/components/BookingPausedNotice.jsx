import { PauseCircle } from 'lucide-react';
import { useT } from '@/contexts/LanguageContext';

/* Shown above an item's info (in place of the date/slot form and submit
   button) while BOOKINGS_PAUSED is true. The listing card's "More Info" link
   still navigates here - it's just the transaction part that's removed. */
export default function BookingPausedNotice() {
  const { t } = useT();
  return (
    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4 flex gap-3 items-start">
      <PauseCircle className="h-5 w-5 text-[#8D2800] shrink-0 mt-0.5" />
      <p className="text-sm text-[#621B00]">
        {t(
          'Online booking is temporarily paused. Please contact the temple office directly to arrange this.',
          'ఆన్‌లైన్ బుకింగ్ తాత్కాలికంగా నిలిపివేయబడింది. దయచేసి దీని కొరకు నేరుగా దేవస్థాన కార్యాలయాన్ని సంప్రదించండి.'
        )}
      </p>
    </div>
  );
}
