import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import UserBottomNav from './UserBottomNav';
import OrganizationBottomNav from './OrganizationBottomNav';
import { getStoredUserContext, hasAuthSession } from '@/utils/authSession.util';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show bottom nav on small screens only if user is authenticated
  const isMobile = window.innerWidth < 768;
  const isAuthenticated = hasAuthSession() && !!getStoredUserContext();
  const showBottomNav = isMobile && isAuthenticated;
  // Determine user type (basic example, adjust as needed)
  const userType = localStorage.getItem('user_type');

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
        }`}
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-6 flex justify-between items-center max-w-7xl">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <div className="mr-1 sm:mr-2">
              <img src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png" alt="Appointza Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <span className={`text-base sm:text-lg md:text-xl font-bold ${isScrolled ? 'text-appointza-navy' : 'text-appointza-navy'}`}>
              Appointza
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 2xl:space-x-8">
            <Link to="/" className={`font-medium ${isScrolled ? 'text-appointza-navy' : 'text-appointza-navy'} hover:text-appointza-teal`}>
              Home
            </Link>
            <Link to="/features" className={`font-medium ${isScrolled ? 'text-appointza-navy' : 'text-appointza-navy'} hover:text-appointza-teal`}>
              Features
            </Link>
            <Link to="/use-cases" className={`font-medium ${isScrolled ? 'text-appointza-navy' : 'text-appointza-navy'} hover:text-appointza-teal`}>
              Use Cases
            </Link>
            <Link to="/plans" className={`font-medium ${isScrolled ? 'text-appointza-navy' : 'text-appointza-navy'} hover:text-appointza-teal`}>
              Pricing
            </Link>
            <Link to="/explore">
              <Button variant="default" className="font-medium bg-appointza-teal hover:bg-appointza-teal/90 text-white">
                Explore Services
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="default" className="font-medium bg-appointza-navy hover:bg-appointza-navy/90 text-white">
                Create an Account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="font-medium">
                Login
              </Button>
            </Link> 
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-appointza-navy p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white py-4 shadow-lg animate-fade-in max-h-[calc(100vh-80px)] overflow-y-auto">
            <nav className="container mx-auto px-3 sm:px-4 flex flex-col space-y-3 sm:space-y-4">
              <Link 
                to="/" 
                className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/features" 
                className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                to="/use-cases" 
                className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Use Cases
              </Link>
              <Link 
                to="/plans" 
                className="px-4 py-2 text-appointza-navy hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                to="/explore"
                className="px-4 py-2 bg-appointza-teal text-white rounded font-medium text-center hover:bg-appointza-teal/90"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore Services
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 bg-appointza-navy text-white rounded font-medium text-center hover:bg-appointza-navy/90"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create an Account
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 bg-gray-100 text-appointza-navy rounded font-medium text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </nav>
          </div>
        )}

        {/* Bottom Navigation - Conditionally Rendered */}
        {showBottomNav && (
          userType === 'organization' ? <OrganizationBottomNav /> : <UserBottomNav />
        )}
      </header>
    </>
  );
};

export default Header;
