import { Header } from "@/components/header";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, FileText, Scale } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000";
    const canonical = baseUrl.replace(/\/$/, "") + "/terms";
    return {
      meta: [
        { title: "CRM Platform - Terms" },
        {
          name: "description",
          content:
            "Modern CRM platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "CRM Platform - Terms" },
        {
          property: "og:description",
          content:
            "Modern CRM platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "CRM Platform - Terms" },
        {
          name: "twitter:description",
          content:
            "Modern CRM platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            Terms of Service
          </h1>
          <p className="mb-2 text-muted-foreground text-xl">
            Last Updated: January 16, 2024
          </p>
          <p className="text-muted-foreground">
            Please read these terms carefully before using our services.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-4xl">
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-bold text-2xl text-foreground">
                <FileText className="h-6 w-6 text-primary" />
                1. Acceptance of Terms
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  By accessing or using CRM Platform ("the Service"), you agree
                  to be bound by these Terms of Service ("Terms"). If you
                  disagree with any part of these terms, you may not access the
                  Service.
                </p>
                <p>
                  These Terms apply to all users of the Service, including
                  without limitation users who are browsers, vendors, customers,
                  merchants, and contributors of content.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                2. Use License
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  Permission is granted to temporarily access the materials on
                  CRM Platform for personal or commercial transitory viewing
                  only. This is the grant of a license, not a transfer of title,
                  and under this license you may not:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Modify or copy the materials</li>
                  <li>
                    Use the materials for any commercial purpose or for any
                    public display
                  </li>
                  <li>
                    Attempt to reverse engineer any software contained on the
                    platform
                  </li>
                  <li>
                    Remove any copyright or other proprietary notations from the
                    materials
                  </li>
                  <li>
                    Transfer the materials to another person or "mirror" the
                    materials on any other server
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                3. Account Registration
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  To access certain features of the Service, you must register
                  for an account. You agree to:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    Provide accurate, current, and complete information during
                    registration
                  </li>
                  <li>Maintain and promptly update your account information</li>
                  <li>
                    Maintain the security of your password and identification
                  </li>
                  <li>
                    Accept all responsibility for activities that occur under
                    your account
                  </li>
                  <li>
                    Notify us immediately of any unauthorized use of your
                    account
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                4. User Content
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  You retain ownership of any content you submit, post, or
                  display on or through the Service ("User Content"). By
                  submitting User Content, you grant us a worldwide,
                  non-exclusive, royalty-free license to use, reproduce, and
                  distribute your User Content solely for the purpose of
                  providing and improving the Service.
                </p>
                <p>You are responsible for ensuring that your User Content:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    Does not violate any third-party rights, including
                    intellectual property rights
                  </li>
                  <li>
                    Does not contain unlawful, harmful, or offensive material
                  </li>
                  <li>Complies with all applicable laws and regulations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                5. Payment Terms
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  If you purchase a subscription, you agree to pay all fees
                  associated with your selected plan. Subscription fees are
                  billed in advance on a monthly or annual basis, as selected.
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    All fees are non-refundable except as required by law or as
                    explicitly stated in our refund policy
                  </li>
                  <li>
                    We reserve the right to change our pricing with 30 days'
                    notice
                  </li>
                  <li>
                    If payment fails, we may suspend or terminate your account
                  </li>
                  <li>
                    You are responsible for any taxes applicable to your use of
                    the Service
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 font-bold text-2xl text-foreground">
                <AlertCircle className="h-6 w-6 text-primary" />
                6. Prohibited Uses
              </h2>
              <div className="space-y-3 text-foreground">
                <p>You may not use the Service:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    For any unlawful purpose or to solicit others to perform
                    unlawful acts
                  </li>
                  <li>
                    To violate any international, federal, provincial, or state
                    regulations, rules, or laws
                  </li>
                  <li>
                    To infringe upon or violate our intellectual property rights
                    or the rights of others
                  </li>
                  <li>
                    To harass, abuse, insult, harm, defame, slander, disparage,
                    intimidate, or discriminate
                  </li>
                  <li>To submit false or misleading information</li>
                  <li>
                    To upload or transmit viruses or any other type of malicious
                    code
                  </li>
                  <li>
                    To collect or track the personal information of others
                  </li>
                  <li>
                    To spam, phish, pharm, pretext, spider, crawl, or scrape
                  </li>
                  <li>For any obscene or immoral purpose</li>
                  <li>
                    To interfere with or circumvent the security features of the
                    Service
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                7. Service Availability
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  We strive to maintain high availability of the Service but do
                  not guarantee uninterrupted access. The Service may be
                  unavailable due to maintenance, updates, or circumstances
                  beyond our control.
                </p>
                <p>
                  We reserve the right to modify, suspend, or discontinue the
                  Service (or any part thereof) at any time with or without
                  notice.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                8. Termination
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  We may terminate or suspend your account and access to the
                  Service immediately, without prior notice, for any reason,
                  including breach of these Terms.
                </p>
                <p>
                  Upon termination, your right to use the Service will cease
                  immediately. You may terminate your account at any time by
                  contacting us or using the account deletion feature in your
                  settings.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                9. Disclaimer
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                  WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
                  BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                10. Limitation of Liability
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  IN NO EVENT SHALL CRM PLATFORM, ITS DIRECTORS, EMPLOYEES, OR
                  AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT
                  LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
                  INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                11. Governing Law
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  These Terms shall be governed by and construed in accordance
                  with the laws of the State of California, United States,
                  without regard to its conflict of law provisions.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                12. Changes to Terms
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  We reserve the right to modify these Terms at any time. We
                  will notify users of any material changes by posting the new
                  Terms on this page and updating the "Last Updated" date.
                </p>
                <p>
                  Your continued use of the Service after any such changes
                  constitutes your acceptance of the new Terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-bold text-2xl text-foreground">
                13. Contact Information
              </h2>
              <div className="space-y-3 text-foreground">
                <p>
                  If you have any questions about these Terms, please contact
                  us:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <p className="font-semibold">CRM Platform Legal Team</p>
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:legal@crmplatform.com"
                      className="text-primary hover:underline"
                    >
                      legal@crmplatform.com
                    </a>
                  </p>
                  <p>
                    Address: 123 Business Street, San Francisco, CA 94105,
                    United States
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
