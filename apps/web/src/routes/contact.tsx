import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button, Card, CardContent, Input, Textarea } from "@crm/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { leadsApi } from "@/lib/api";

export const Route = createFileRoute("/contact")({
  head: () => {
    const baseUrl =
      import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3001";
    const canonical = baseUrl.replace(/\/$/, "") + "/contact";
    return {
      meta: [
        { title: "Nucleo One - Contact" },
        {
          name: "description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "Nucleo One - Contact" },
        {
          property: "og:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Nucleo One - Contact" },
        {
          name: "twitter:description",
          content:
            "Modern Nucleo One platform for managing customer relationships, sales pipelines, and business operations. Streamline your sales process and grow your business.",
        },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },

  component: ContactPage,
});

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Message is required");
      return;
    }

    setSubmitting(true);
    try {
      await leadsApi.create({
        email: formData.email,
        firstName: formData.name.split(" ")[0] || "",
        lastName: formData.name.split(" ").slice(1).join(" ") || "",
        source: "website",
        notes: `Subject: ${formData.subject}\n\nMessage: ${formData.message}`
      });

      setSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send the message. Please try again later.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-card">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 font-bold text-5xl text-foreground">
            Get in Touch
          </h1>
          <p className="text-muted-foreground text-xl">
            Have a question? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Contact Information */}
            <div>
              <h2 className="mb-6 font-bold text-2xl text-foreground">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">
                      Email
                    </h3>
                    <p className="text-muted-foreground">
                      support@nucleoone.com
                    </p>
                    <p className="text-muted-foreground">sales@nucleoone.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">
                      Phone
                    </h3>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-muted-foreground text-sm">
                      Mon-Fri, 9am-5pm EST
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">
                      Address
                    </h3>
                    <p className="text-muted-foreground">
                      123 Business Street
                      <br />
                      San Francisco, CA 94105
                      <br />
                      United States
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-lg bg-primary/5 p-6">
                <h3 className="mb-2 font-semibold text-foreground">
                  Need Immediate Help?
                </h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  Check out our{" "}
                  <Link to="/support" className="text-primary hover:underline">
                    support center
                  </Link>{" "}
                  for answers to common questions, or browse our{" "}
                  <Link to="/docs" className="text-primary hover:underline">
                    documentation
                  </Link>
                  .
                </p>
                <Link to="/support">
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Visit Support Center
                  </Button>
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-6 font-bold text-2xl text-foreground">
                  Send us a Message
                </h2>
                {submitted ? (
                  <div className="rounded-lg border border-success/30 bg-success/15 p-4">
                    <p className="font-medium text-success">
                      Thank you for your message!
                    </p>
                    <p className="mt-1 text-sm text-success">
                      We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-1 block font-medium text-foreground text-sm"
                      >
                        Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1 block font-medium text-foreground text-sm"
                      >
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="subject"
                        className="mb-1 block font-medium text-foreground text-sm"
                      >
                        Subject
                      </label>
                      <Input
                        id="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        placeholder="What's this about?"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="message"
                        className="mb-1 block font-medium text-foreground text-sm"
                      >
                        Message
                      </label>
                      <Textarea
                        id="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us more..."
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
