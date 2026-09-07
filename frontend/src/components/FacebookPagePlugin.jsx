import { useEffect, useRef } from 'react';

const FB_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v21.0';

function ensureFacebookSdk() {
  if (document.getElementById('facebook-jssdk')) return;
  if (!document.getElementById('fb-root')) {
    const fbRoot = document.createElement('div');
    fbRoot.id = 'fb-root';
    document.body.prepend(fbRoot);
  }
  const script = document.createElement('script');
  script.id = 'facebook-jssdk';
  script.async = true;
  script.defer = true;
  script.crossOrigin = 'anonymous';
  script.src = FB_SDK_SRC;
  document.body.appendChild(script);
}

/* Embeds Facebook's official Page Plugin - a compact widget showing the
   Page's real follower count and a one-click Follow button, rather than
   just a link to Facebook. The JS SDK only scans the page for .fb-page divs
   once, on its own load, so a div React adds after that (e.g. on navigating
   back to this page) needs window.FB.XFBML.parse() called on it manually -
   polled briefly here since the SDK script loads async and may not be ready
   yet on first mount. */
export default function FacebookPagePlugin({ width = 300, height = 70 }) {
  const ref = useRef(null);

  useEffect(() => {
    ensureFacebookSdk();
    const tryParse = () => {
      if (window.FB && ref.current) {
        window.FB.XFBML.parse(ref.current);
        return true;
      }
      return false;
    };
    if (tryParse()) return;
    const interval = setInterval(() => { if (tryParse()) clearInterval(interval); }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={ref} data-testid="facebook-page-plugin">
      <div
        className="fb-page"
        data-href="https://www.facebook.com/CheruvugattuTemple/"
        data-tabs=""
        data-width={width}
        data-height={height}
        data-small-header="false"
        data-adapt-container-width="true"
        data-hide-cover="true"
        data-show-facepile="false"
      />
    </div>
  );
}
