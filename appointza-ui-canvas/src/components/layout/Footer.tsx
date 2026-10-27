
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e6eaf0] bg-white text-[#344054] pt-8 sm:pt-12 pb-6 sm:pb-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="mr-2">
                <img src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png" alt="Appointza Logo" className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold">Appointza</span>
            </div>
            <p className="text-[#667085] mb-4">
              Appointza is a slot-based booking system with WhatsApp integration, multi-location support, staff role management, payment tracking, and an analytics dashboard. Perfect for salons, clinics, event organizers, and service-based businesses.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-[#667085] hover:text-[#528ff0] transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-[#667085] hover:text-[#528ff0] transition">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/use-cases" className="text-[#667085] hover:text-[#528ff0] transition">
                  Use Cases
                </Link>
              </li>
              <li>
                <Link to="/turf" className="text-[#667085] hover:text-[#528ff0] transition">
                  Turf directory
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#667085] hover:text-[#528ff0] transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-[#667085] hover:text-[#528ff0] transition">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-[#667085] hover:text-[#528ff0] transition">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-[#667085] hover:text-[#528ff0] transition">
                  Help Center
                </Link>
              </li>
              <li>   <Link to="/privacy" className="text-[#98a2b3] hover:text-[#528ff0] transition">
              Privacy
            </Link></li>
            <li>   <Link to="/terms" className="text-[#98a2b3] hover:text-[#528ff0] transition">
              Terms
            </Link></li>
              
              {/* <li>
                <Link to="/blog" className="text-[#667085] hover:text-[#528ff0] transition">
                  Blog
                </Link>
              </li> */}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#eef1f5] pt-8 mt-8 text-center md:flex md:justify-between md:items-center">
          <p className="text-[#98a2b3]">© {currentYear} Appointza. All rights reserved.</p>
          {/* <div className="mt-4 md:mt-0 flex justify-center md:justify-end space-x-6">
            <Link to="/terms" className="text-[#98a2b3] hover:text-[#528ff0] transition">
              Terms
            </Link>
            <Link to="/privacy" className="text-[#98a2b3] hover:text-[#528ff0] transition">
              Privacy
            </Link>
            <Link to="/contact" className="text-[#98a2b3] hover:text-[#528ff0] transition">
              Contact Us
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
