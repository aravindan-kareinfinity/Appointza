
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Privacy Policy - Appointza</title>
      </Helmet>
      
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-appointza-navy mb-2">Privacy Policy for Appointza</h1>
            <p className="text-gray-600 mb-8">Effective Date: January 15, 2025 | Last Updated: September 27, 2026</p>
            
            <div className="space-y-8">
              <section>
                <p className="text-gray-700 leading-relaxed mb-6">
                  This Privacy Policy explains how Appointza Technology (OPC) Private Limited ("Appointza", "we", "our", or "us") collects, uses, discloses, and protects your information when you use our website, mobile application, and related services (collectively, the "Services"). By using our Services, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">1. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      We collect information you provide directly to us, including:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Name, email address, phone number, and contact information</li>
                      <li>Business details (for service providers)</li>
                      <li>Appointment booking information and preferences</li>
                      <li>Payment information (processed securely through third-party providers)</li>
                      <li>Account credentials and profile information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Information</h3>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      We automatically collect information about how you use our Services:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>Appointment booking history and patterns</li>
                      <li>Service preferences and interactions</li>
                      <li>Device information and browser type</li>
                      <li>IP address and location data</li>
                      <li>App usage statistics and performance data</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">We use the collected information to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Provide, maintain, and improve our Services</li>
                  <li>Process appointments, bookings, and payments</li>
                  <li>Send appointment confirmations, reminders, and notifications</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Personalize your experience and recommend relevant services</li>
                  <li>Analyze usage patterns to improve our platform</li>
                  <li>Comply with legal obligations and prevent fraud</li>
                  <li>Communicate important updates about our Services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">3. Information Sharing and Disclosure</h2>
                <p className="text-gray-700 leading-relaxed mb-4">We may share your information in the following circumstances:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>With Service Providers:</strong> When you book appointments, we share necessary information with the business/service provider</li>
                  <li><strong>With Third-Party Partners:</strong> Payment processors, analytics providers, and other service providers who assist in operating our platform</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and safety</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sale of assets</li>
                  <li><strong>With Your Consent:</strong> For any other purpose with your explicit permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">4. Data Security</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement comprehensive security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>End-to-end encryption for sensitive data transmission</li>
                  <li>Secure servers with regular security audits</li>
                  <li>Access controls and authentication protocols</li>
                  <li>Regular security assessments and updates</li>
                  <li>Employee training on data protection practices</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">5. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our Services and fulfill the purposes outlined in this policy. 
                  We may retain certain information for longer periods as required by law, for legitimate business purposes, or to resolve disputes. 
                  When we no longer need your information, we will securely delete or anonymize it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">6. Your Rights and Choices</h2>
                <p className="text-gray-700 leading-relaxed mb-4">You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate personal information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information for certain purposes</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  To exercise these rights, please contact us using the information provided in the "Contact Us" section.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">7. Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to enhance your experience:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for basic functionality of our Services</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You can control cookie settings through your browser preferences, though some features may not function properly if cookies are disabled.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">8. Third-Party Services</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our Services may integrate with third-party services such as payment processors, calendar applications, and analytics providers. 
                  These services have their own privacy policies and data practices. We encourage you to review their privacy policies to understand how they handle your information. 
                  We are not responsible for the privacy practices of these third-party services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">9. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our Services are not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. 
                  If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. 
                  If we discover that we have collected information from a child under 18, we will take steps to delete such information promptly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">10. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your country of residence. 
                  We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards, 
                  including standard contractual clauses and adequacy decisions, to protect your personal information during international transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. 
                  We will notify you of any material changes by posting the updated policy on our website and updating the "Last Updated" date. 
                  We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">
                  12. Napz Destination Alarm (com.wakemethere)
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Napz is a destination arrival-alarm application published by Appointza Technology
                    (OPC) Private Limited under the Android package name <strong>com.wakemethere</strong>.
                    The following terms describe how Napz handles location and account information.
                  </p>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Location data and purpose</h3>
                    <p>
                      Napz collects and uses precise location data to determine your current location,
                      calculate your distance from a destination you select, show your position on the
                      map, save a current place when requested, and trigger your destination arrival
                      alarm when you enter the selected alert radius.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Background location</h3>
                    <p>
                      During an active trip, Napz continues collecting precise location in the
                      background, including when the app is minimized, the screen is off, or the app is
                      closed where Android allows. Background collection is used to calculate distance
                      and trigger the arrival alarm, and stops when you stop the trip or the trip ends.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      On-device processing and map providers
                    </h3>
                    <p>
                      Continuous trip GPS used for distance checks and arrival alarms is processed on
                      your device and is not uploaded to Napz servers. When you use map, place-search,
                      or place-name features, Napz may transmit your search text, current location,
                      selected map coordinates, or search-location bias to Google Maps, Google Places,
                      Google Geocoding, or OpenStreetMap Nominatim to provide the feature you requested.
                      Napz does not use location data for advertising or marketing.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Permissions and consent</h3>
                    <p>
                      Napz presents an in-app location disclosure and requires an affirmative
                      “Agree &amp; Continue” action before requesting Android location permission.
                      Foreground permission is requested when you use a location feature. A separate
                      background-location disclosure is shown before background permission is requested
                      for an active trip. You may deny or revoke permissions in Android Settings.
                    </p>
                  </div>

                  <div id="napz-account-deletion">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Account information, retention, and deletion
                    </h3>
                    <p>
                      If you sign in with Google, Napz may store your name, email address, profile photo,
                      and optional profile fields through Firebase Authentication and Firestore. Saved
                      places and active-trip state are stored on your device until you delete them, stop
                      the trip, clear app data, or uninstall Napz. Napz does not store the continuous
                      trip GPS stream in Firebase.
                    </p>
                    <p className="mt-2">
                      You can request account deletion from the Napz Account screen. This stops active
                      tracking and permanently deletes the Firebase account, Firestore profile and
                      login records controlled by Napz, and local app data. You may also
                      request deletion outside the app by emailing <strong>appointza@gmail.com</strong>
                      with the subject “Napz Account Deletion” and the email address associated with the
                      account. Information may be retained only where required for security, fraud
                      prevention, dispute resolution, or legal obligations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Napz privacy contact</h3>
                    <p>
                      For Napz privacy questions, data-access requests, or deletion requests, email
                      <strong> appointza@gmail.com</strong> or use the company contact details below.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-appointza-navy mb-4">13. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                  <br /><br />
                  <strong>APPOINTZA TECHNOLOGY (OPC) PRIVATE LIMITED</strong><br />
                  83A/7, CUDDALORE MAIN ROAD OPP.TO AISWARIYA HOME NEEDS, 2ND FLOOR, PANRUTI, Panruti, Panruti,<br />
                  Cuddalore- 607106, Tamil Nadu<br /><br />
                  📧 Email: appointza@gmail.com<br />
                  📞 Phone: +91-9080539126<br />
                  🌐 Website: www.appointza.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
