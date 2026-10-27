import MarketingHomePage from "@/components/home/MarketingHomePage";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { getAppBaseUrl } from "@/utils/environment";
import { OrganisationService } from "@/services/organisation.service";
import { Capacitor } from "@capacitor/core";
import { useSafeArea } from "@/hooks/useSafeArea";
import { extractOrganisationCustomSubdomain } from "@/utils/orgPublicSiteUrl.util";
import { resolvePostLoginPath } from "@/utils/postAuthNavigation";
import {
  HOME_SEO_TITLE,
  HOME_SEO_DESCRIPTION,
  HOME_SEO_KEYWORDS,
  buildHomeFaqSchema,
  buildHomeBreadcrumbSchema,
} from "@/utils/homeSeo";

const Index = () => {
  const seoBaseUrl = getAppBaseUrl() || window.location.origin;
  const seoImageUrl = `${seoBaseUrl}/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png`;
  const initialCustomDomain = extractOrganisationCustomSubdomain(window.location.host);
  const [isCustomDomain, setIsCustomDomain] = useState<boolean>(!!initialCustomDomain);
  const [isProcessingCustomDomain, setIsProcessingCustomDomain] = useState<boolean>(!!initialCustomDomain);
  const navigate = useNavigate();
  const insets = useSafeArea();
  
  // Detect if running in native Capacitor app (Android/iOS)
  // When loading from remote server, we need multiple detection methods
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);
  
  useEffect(() => {
    const detectNativeApp = () => {
      try {
        // Method 1: Check Capacitor platform
        const platform = Capacitor.getPlatform();
        console.log('Capacitor platform detected:', platform);
        
        // Method 2: Check for native bridge (most reliable)
        const hasCapacitor = !!(window as any).Capacitor;
        const hasNativeBridge = !!(window as any).Capacitor?.isNative;
        // Method 3: Check for Capacitor's native flag (with fallback)
        const isNative = typeof Capacitor !== "undefined" && !!(Capacitor as any).isNative;

        // Method 4: Check for Capacitor Plugins object presence
        const hasPlugins =
          typeof window !== "undefined" &&
          !!(window as any).Capacitor &&
          !!(window as any).Capacitor.Plugins;
        const href = window.location.href;
        const isCapacitorURL = href.startsWith('capacitor://') || href.startsWith('file://');
        
        // Method 6: Check for Android WebView (more reliable)
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroidWebView = userAgent.includes('wv') || 
                                 (userAgent.includes('android') && 
                                  !userAgent.includes('chrome') && 
                                  userAgent.includes('version/'));
        
        // Method 7: Check for iOS WebView (improved detection)
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = userAgent.includes('safari');
        const hasChromeInUA = userAgent.includes('crios') || userAgent.includes('fxios');
        // Fix: navigator.standalone is only available on iOS Safari (PWA), prevent TS error by type check
        const isStandalone = typeof (navigator as any).standalone !== "undefined" ? (navigator as any).standalone : false;
        const isIOSWebView = isIOS && isSafari && !hasChromeInUA && !isStandalone;
        
        // Combine all checks
        const detectedAsNative = (
          // Option A: Capacitor native detection
          platform === 'android' || 
          platform === 'ios' ||
          isNative ||

          // Option B: Native bridge detected
          hasNativeBridge ||
          
          // Option C: URL scheme indicates native
          isCapacitorURL ||
          
          // Option D: WebView detection
          isAndroidWebView ||
          isIOSWebView
        );
        
       
        
        return detectedAsNative;
        
      } catch (error) {
        console.error('Error detecting native app:', error);
        return false;
      }
    };
    
    setIsNativeApp(detectNativeApp());
  }, []);

  // API services
  const organisationService = new OrganisationService();

  // Handle custom domain redirect
  useEffect(() => {
    const handleCustomDomain = async () => {
      const hostname = window.location.host;
      
      const customUrlSlug = extractOrganisationCustomSubdomain(hostname);
      if (customUrlSlug) {
        
        console.log('🌐 Custom domain detected:', hostname);
        setIsCustomDomain(true);
        setIsProcessingCustomDomain(true);
        
        try {
          console.log('📋 Custom URL slug:', customUrlSlug);

          const orgDetail = await organisationService.getOrganisationByCustomUrl(customUrlSlug);

          if (!orgDetail || !orgDetail.organisationlocationid) {
            throw new Error('Organization location not found for this custom URL');
          }

          console.log('✅ Found organization location:', orgDetail.organisationlocationid);
          // Subdomain root is the canonical public URL; CustomDomainRedirect renders the template at `/`.
          navigate('/', { replace: true });
          
        } catch (error) {
          console.error('❌ Error processing custom domain:', error);
          // Continue to show the main page if custom domain processing fails
          setIsCustomDomain(false);
        } finally {
          setIsProcessingCustomDomain(false);
        }
      }
    };

    handleCustomDomain();
  }, [navigate, organisationService]);

  useEffect(() => {
    // Check if user is already authenticated and redirect
    const checkExistingAuth = () => {
      const token = localStorage.getItem('auth_token');
      const userContextStr = localStorage.getItem('user_context');
      const storedUserType = localStorage.getItem('user_type');
      
      if (token && userContextStr) {
        console.log('Index: User already authenticated, redirecting...');
        try {
          const userContext = JSON.parse(userContextStr);
          
          // Determine user type
          let userType: 'user' | 'organization' = 'user';
          if (userContext.organisationid && userContext.organisationid > 0) {
            userType = 'organization';
          }
          
          // Use stored type if available
          const finalUserType = storedUserType || userType;
          
          // Redirect based on user type
          if (finalUserType === 'user') {
            navigate(resolvePostLoginPath('user'), { replace: true });
          } else {
            navigate('/organization/dashboard', { replace: true });
          }
        } catch (error) {
          console.error('Index: Error parsing stored user context:', error);
          // Clear invalid data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('user_context');
        }
      }
    };
    
    checkExistingAuth();
  }, [navigate]);

  // Show loading screen while processing custom domain
  if (isProcessingCustomDomain) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#f5f7f9] safe-area-all"
        style={isNativeApp ? {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right
        } : undefined}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5af5] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Your Booking Page
          </h2>
          <p className="text-gray-600">
            Please wait while we find your business location...
          </p>
        </div>
      </div>
    );
  }

  // Always show the normal landing page for all platforms (mobile web, native apps, desktop)
  // Users can navigate to login/signup from the header or CTA sections
  return (
    <>
      <Helmet>
        <title>{HOME_SEO_TITLE}</title>
        <meta name="description" content={HOME_SEO_DESCRIPTION} />
        <meta name="keywords" content={HOME_SEO_KEYWORDS} />
        <link rel="canonical" href={`${seoBaseUrl}/`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={HOME_SEO_TITLE} />
        <meta property="og:description" content={HOME_SEO_DESCRIPTION} />
        <meta property="og:url" content={`${seoBaseUrl}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={seoImageUrl} />
        <meta property="og:site_name" content="Appointza" />
        <meta property="og:locale" content="en_IN" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={HOME_SEO_TITLE} />
        <meta name="twitter:description" content={HOME_SEO_DESCRIPTION} />
        <meta name="twitter:image" content={seoImageUrl} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Appointza",
            "applicationCategory": "BusinessApplication",
            "applicationSubCategory": "Appointment Booking Software",
            "operatingSystem": "Web, iOS, Android",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR",
              "description": "Free plan with free business website and 50 free bookings per month"
            },
            "description": HOME_SEO_DESCRIPTION,
            "url": seoBaseUrl,
            "logo": seoImageUrl,
            "screenshot": seoImageUrl,
            "featureList": [
              "Free business website with online booking page",
              "Appointment booking software and online booking system",
              "Online appointment booking and slot booking software",
              "WhatsApp booking system and SMS reminders",
              "UPI, card, and wallet payment collection",
              "Salon booking software and clinic appointment software",
              "Gym booking software and event booking software",
              "QR check-in software for events",
              "Multi-location booking management system",
              "Business analytics dashboard"
            ]
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Appointza Appointment Booking Software",
            "description": HOME_SEO_DESCRIPTION,
            "brand": {
              "@type": "Brand",
              "name": "Appointza"
            },
            "category": "Appointment Booking Software",
            "url": seoBaseUrl,
            "image": seoImageUrl,
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR",
              "availability": "https://schema.org/InStock",
              "url": `${seoBaseUrl}/register`
            }
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify(buildHomeFaqSchema(`${seoBaseUrl}/#faq`))}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(buildHomeBreadcrumbSchema(seoBaseUrl))}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Appointza",
            "url": seoBaseUrl,
            "logo": seoImageUrl,
            "description": HOME_SEO_DESCRIPTION,
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-90805-39126",
              "contactType": "Customer Service",
              "email": "appointza@gmail.com"
            },
            "sameAs": [
              "https://twitter.com/appointza"
            ]
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Appointza",
            "url": seoBaseUrl,
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${seoBaseUrl}/explore?search={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Appointment Booking Software",
            "provider": {
              "@type": "Organization",
              "name": "Appointza"
            },
            "areaServed": {
              "@type": "Country",
              "name": "India"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Appointment Booking Services",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Salon Booking Software",
                    "description": "Online appointment booking and salon booking software for beauty salons and spas"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Clinic Appointment Software",
                    "description": "Doctor appointment booking and clinic management software for healthcare providers"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Gym Booking Software",
                    "description": "Fitness booking software and gym management software for trainers and fitness centers"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Event Booking Software",
                    "description": "Event ticket booking software with QR check-in for organizers"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Resort Booking Software",
                    "description": "Resort and hotel booking software for stays and appointment-based services"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Sports Turf Booking Software",
                    "description": "Online booking system for sports turf and facility slot bookings"
                  }
                }
              ]
            }
          })}
        </script>
      </Helmet>
      
      <div
        className="min-h-screen overflow-x-hidden bg-[#f5f7f9]"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: Math.max(insets.left, 0),
          paddingRight: Math.max(insets.right, 0)
        }}
      >
        <MarketingHomePage />
      </div>
    </>
  );
};

export default Index;
