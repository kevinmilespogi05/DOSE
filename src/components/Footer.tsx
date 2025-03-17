import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white shadow-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">PharmaCare</h3>
            <p className="text-gray-600">
              Your trusted partner in health and wellness. Quality medicines and professional service.
            </p>
          </div>
          
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-600 hover:text-blue-600">Products</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-blue-600">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
              </li>
            </ul>
          </div>
          
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Info</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-center sm:justify-start text-gray-600">
                <Phone className="w-5 h-5 mr-2" />
                <span>+1 234 567 890</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start text-gray-600">
                <Mail className="w-5 h-5 mr-2" />
                <span>contact@pharmacare.com</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start text-gray-600">
                <MapPin className="w-5 h-5 mr-2" />
                <span>123 Health Street, Medical City</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Hours</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Monday - Friday: 8:00 AM - 9:00 PM</li>
              <li>Saturday: 9:00 AM - 7:00 PM</li>
              <li>Sunday: 10:00 AM - 6:00 PM</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} PharmaCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;