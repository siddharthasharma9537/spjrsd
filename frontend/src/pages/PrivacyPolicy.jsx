import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import { useT } from "@/contexts/LanguageContext";

const LAST_UPDATED = '26 September 2026';

function Section({ title, children }) {
  return (
    <section className="mb-7">
      <h2 className="text-lg font-semibold text-[#621B00] mb-2">{title}</h2>
      <div className="text-sm text-[#5D4037] leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  const { heading } = useT();

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="privacy-title">Privacy Policy</h1>
          <p className="text-xs text-[#8D6E63]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-8">
          <Section title="Who we are">
            <p>
              This website, cheruvugattu.online, is operated for Sri Parvathi Jadala Ramalingeshwara Swamy
              Devasthanams, Cheruvugattu, Narketpally Mandal, Nalgonda District, Telangana - 508254, India
              ("the Devasthanam", "we"). This policy explains what personal information the website and our
              WhatsApp service collect, why, and what we do with it.
            </p>
          </Section>

          <Section title="Information we collect">
            <p>We collect only what is needed for the service you ask for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Your account:</strong> name, email address, mobile number (optional), gotram (optional) and a password. Passwords are stored in hashed form, never in plain text.</li>
              <li><strong>Sign in with Google:</strong> if you choose it, we receive your name and email address from Google. We do not receive your Google password or access your Google data beyond this.</li>
              <li><strong>Seva and ticket bookings:</strong> the seva, date and time slot, number of persons, gotram, nakshatra and rashi you provide, and your booking history.</li>
              <li><strong>Donations and accommodation:</strong> your name, mobile number, email address, any message you add, and the donation or room booking details.</li>
              <li><strong>Family dates:</strong> names, relationship and birthday or anniversary dates, only if you choose to save them.</li>
              <li><strong>Forms:</strong> messages you send through Contact Us, the Volunteer form and the newsletter sign-up.</li>
              <li><strong>WhatsApp and chat:</strong> if you message the Devasthanam's WhatsApp number or use the website chat assistant, we receive your phone number (WhatsApp) and the text of your messages.</li>
              <li><strong>Usage information:</strong> anonymous visit counts and page-usage statistics, used to keep the site working and understand what is useful.</li>
            </ul>
          </Section>

          <Section title="How we use it">
            <ul className="list-disc pl-5 space-y-1">
              <li>To create your account, verify your email address and let you sign in.</li>
              <li>To confirm and issue seva tickets, donation receipts (including 80G receipts) and accommodation bookings.</li>
              <li>To answer your questions and messages, and to contact you about your booking.</li>
              <li>To send the weekly panchangam and festival email, only if you subscribed. You can unsubscribe at any time.</li>
              <li>To keep the website secure and prevent misuse.</li>
            </ul>
            <p>We do not sell your personal information, and we do not use it for advertising.</p>
          </Section>

          <Section title="Who else handles your information">
            <p>We use a small number of service providers to run the website. They process information only to provide their service to us:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Website and server hosting, and our database provider.</li>
              <li>Email delivery, used for verification and notification emails.</li>
              <li>Meta (WhatsApp), for our WhatsApp service.</li>
              <li>Google, for Sign in with Google.</li>
              <li>An AI provider, which receives the text of your message when you use the chat assistant, so it can write a reply. Please do not put sensitive personal details in chat messages.</li>
            </ul>
            <p>We may also disclose information where the law requires it.</p>
          </Section>

          <Section title="Temple announcements and Google">
            <p>
              The Devasthanam's authorised staff use the Google Business Profile API only to publish the
              Devasthanam's own news and festival announcements to its own Google listing. This does not
              involve any devotee's personal information. Our use of information received from Google APIs
              adheres to the Google API Services User Data Policy, including its Limited Use requirements.
            </p>
          </Section>

          <Section title="How long we keep it and how we protect it">
            <p>
              We keep booking, donation and receipt records for as long as needed to provide the service and
              meet accounting and legal requirements. The website is served over HTTPS and access to
              administrative records is restricted to authorised temple staff.
            </p>
          </Section>

          <Section title="Your choices">
            <p>
              You can ask us to correct or delete your account information, or to stop emailing you, by
              contacting us using the details below. Some booking and donation records may need to be kept
              for accounting reasons even after your account is deleted.
            </p>
          </Section>

          <Section title="Children">
            <p>This website is intended for use by adults. We do not knowingly collect information from children.</p>
          </Section>

          <Section title="Changes to this policy">
            <p>If we change this policy we will update the date at the top of this page.</p>
          </Section>

          <Section title="Contact us">
            <p>
              Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams, Cheruvugattu, Narketpally Mandal,
              Nalgonda District, Telangana - 508254, India.
            </p>
            <p>
              Phone: +91 94910 00701 (Executive Officer)<br />
              Email: aceocheruvugattu@yahoo.in (Temple Office)<br />
              Email: info@cheruvugattu.online (website)
            </p>
          </Section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
