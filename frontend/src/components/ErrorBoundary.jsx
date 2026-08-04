import { Component } from 'react';

/* Without this, any render error in any route unmounts the whole tree and the
   visitor is left on a blank white page with no way back. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#FFFCF5] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="font-english-heading text-5xl text-[#D4AF37] mb-3">॥</p>
          <h1 className="font-english-heading text-2xl text-[#621B00] mb-1">Something went wrong</h1>
          <p className="font-telugu-heading text-lg text-[#8D6E63] mb-4">ఏదో పొరపాటు జరిగింది</p>
          <p className="text-sm text-[#5D4037] mb-6">
            This page could not be displayed. Reloading usually fixes it. If the problem
            continues, please contact the temple office on{' '}
            <a href="tel:+919491000701" className="text-[#621B00] font-medium hover:underline">+91 94910 00701</a>.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase text-sm rounded-full hover:bg-[#C43E00]/90 transition-all"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="px-6 py-3 border border-[#E6DCCA] text-[#5D4037] text-sm rounded-full hover:border-[#D4AF37] transition-all"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
