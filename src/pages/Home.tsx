import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Shield, Clock, MapPin } from 'lucide-react';

const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-16">
        <h1 className="text-5xl font-bold text-gray-900">
          Rent a Car in Olongapo City
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find and book the perfect car for your needs in Barangay East Tapinac and beyond.
          Easy booking, secure payments, and verified owners.
        </p>
        <Link
          to="/cars"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg
            font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          Browse Cars
        </Link>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-blue-600 mx-auto" />
          <h3 className="text-xl font-semibold">Secure Booking</h3>
          <p className="text-gray-600">
            Verified owners and secure payment processing for peace of mind
          </p>
        </div>
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 text-blue-600 mx-auto" />
          <h3 className="text-xl font-semibold">Flexible Rentals</h3>
          <p className="text-gray-600">
            Book by the day or week, with easy pickup and return
          </p>
        </div>
        <div className="text-center space-y-4">
          <MapPin className="h-12 w-12 text-blue-600 mx-auto" />
          <h3 className="text-xl font-semibold">Local Service</h3>
          <p className="text-gray-600">
            Cars available throughout Olongapo City and surrounding areas
          </p>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Featured Cars</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sample featured cars - will be replaced with real data */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={`https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80`}
                alt="Car"
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-2">
                <h3 className="text-xl font-semibold">Toyota Camry</h3>
                <p className="text-gray-600">₱2,500 per day</p>
                <Link
                  to="/cars"
                  className="block text-center bg-blue-600 text-white px-4 py-2 rounded
                    hover:bg-blue-700 transition-colors duration-200"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;