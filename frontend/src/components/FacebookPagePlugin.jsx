import { useEffect, useState } from 'react';
import api from '@/lib/api';

const PAGE_URL = 'https://www.facebook.com/CheruvugattuTemple/';

const FACEBOOK_LOGO_PATH = 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';

function formatFollowerCount(count) {
  if (typeof count !== 'number') return null;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return String(count);
}

/* Real name, follower count and profile picture come from our own
   /facebook-stats endpoint (cached backend-side against the Graph API).
   The facepile row below is decorative only - the Graph API has no way to
   list a Page's actual followers to anyone, even the Page admin, so this
   replaces the boxy, unstyleable Facebook Page Plugin iframe with a badge
   that matches the site's own design instead of Facebook's fixed white one. */
export default function FacebookPagePlugin() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/facebook-stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const followerText = formatFollowerCount(stats?.followers_count);

  return (
    <div className="bg-white border border-[#E6DCCA] rounded-lg p-2.5 flex flex-col gap-2 w-[230px]" data-testid="facebook-page-plugin">
      <div className="flex items-center gap-2.5">
        {stats?.picture_url ? (
          <img src={stats.picture_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#D4AF37] shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs text-[#2D1B0E] truncate">{stats?.name || 'Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams'}</p>
          <p className="text-[10px] text-[#5D4037]">{followerText ? `${followerText} followers` : ' '}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex" aria-hidden="true">
          <div className="w-5 h-5 rounded-full bg-[#B4B2A9] border-2 border-white" />
          <div className="w-5 h-5 rounded-full bg-[#888780] border-2 border-white -ml-1.5" />
          <div className="w-5 h-5 rounded-full bg-[#B4B2A9] border-2 border-white -ml-1.5" />
          <div className="w-5 h-5 rounded-full bg-[#D4AF37] border-2 border-white -ml-1.5 flex items-center justify-center text-[8px] text-white font-medium">+</div>
        </div>
        <a
          href={PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-white bg-[#1877F2] hover:bg-[#1877F2]/90 px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shrink-0"
          data-testid="facebook-follow-button"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d={FACEBOOK_LOGO_PATH} /></svg>
          Follow
        </a>
      </div>
    </div>
  );
}
