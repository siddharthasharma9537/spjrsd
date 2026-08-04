import { AlertCircle, Inbox } from 'lucide-react';

/**
 * Shown when a list finishes loading with nothing to display, so a failed or
 * empty fetch renders an explanation instead of a blank page.
 */
export default function LoadState({ error, emptyText = 'Nothing to show here yet.', onRetry }) {
  const Icon = error ? AlertCircle : Inbox;

  return (
    <div className="text-center py-16 px-4" data-testid={error ? 'load-error' : 'load-empty'}>
      <Icon className={`h-10 w-10 mx-auto mb-4 ${error ? 'text-[#C43E00]' : 'text-[#D4AF37]'}`} />
      {error ? (
        <>
          <p className="text-[#2D1B0E] font-medium mb-1">Unable to load this section</p>
          <p className="text-sm text-[#8D6E63] max-w-sm mx-auto mb-5">
            We could not reach the temple server. Please check your connection and try again,
            or contact the temple office on{' '}
            <a href="tel:+919491000701" className="text-[#621B00] hover:underline">+91 94910 00701</a>.
          </p>
          <button
            onClick={onRetry ? onRetry : () => window.location.reload()}
            className="px-5 py-2.5 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all"
          >
            Try Again
          </button>
        </>
      ) : (
        <p className="text-sm text-[#8D6E63]">{emptyText}</p>
      )}
    </div>
  );
}
