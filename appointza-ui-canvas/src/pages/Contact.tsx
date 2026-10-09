
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, Loader2 } from "lucide-react";
import { environment } from "@/utils/environment";
import { getAuthHeaders } from "@/utils/authSession.util";
import { useAuth } from "@/contexts/AuthContext";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // When the visitor is logged in (org owner or staff), forward both:
      //   - the JWT, so the server can read RequestState.usercontext, and
      //   - the explicit OrganisationId, so the enquiry is attributed to that org.
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      const response = await fetch(`${environment.baseurl}/api/contact`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "",
          subject: formData.subject,
          message: formData.message,
          organisation_id: user?.organisationid ?? 0,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Message Sent Successfully!",
          description: result.message || "Thank you for contacting us. We'll get back to you within 24 hours.",
          variant: "default",
        });
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Contact Us - Appointza</title>
      </Helmet>
      
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-appointza-navy mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about Appointza? We're here to help you succeed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="Your phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select value={formData.subject} onValueChange={(value) => handleChange("subject", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="sales">Sales Question</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        placeholder="Tell us how we can help you..."
                        className="min-h-[120px]"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-appointza-teal hover:bg-appointza-teal/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-appointza-teal mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold">Email</h4>
                      <p className="text-gray-600">appointza@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-appointza-teal mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold">Phone</h4>
                      <p className="text-gray-600">+91 9080539126</p>
                      <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM IST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-appointza-teal mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold">Address</h4>
                      <p className="text-gray-600">
                        APPOINTZA TECHNOLOGY (OPC) PRIVATE LIMITED<br />
                        83A/7, CUDDALORE MAIN ROAD OPP.TO AISWARIYA HOME NEEDS, 2ND FLOOR, PANRUTI, Panruti, Panruti,<br />
                        Cuddalore- 607106, Tamil Nadu
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-appointza-teal mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold">Business Hours</h4>
                      <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="text-gray-600">Sunday: Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg bg-appointza-teal text-white">
                <CardHeader>
                  <CardTitle>Need Immediate Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    For urgent technical issues or billing questions, contact our priority support line.
                  </p>
                  <Button variant="secondary" className="w-full">
                    Priority Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
