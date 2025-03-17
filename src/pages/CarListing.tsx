import React from 'react';
import { Car, Calendar, MapPin, Users } from 'lucide-react';

const CarListing = () => {
  // Temporary mock data
  const cars = [
    {
      id: 1,
      name: 'Toyota Camry 2022',
      price: 2500,
      location: 'East Tapinac, Olongapo City',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80',
      seats: 5,
      transmission: 'Automatic'
    },
    {
      id: 2,
      name: 'Honda Civic 2023',
      price: 2800,
      location: 'East Tapinac, Olongapo City',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80',
      seats: 5,
      transmission: 'Automatic'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Available Cars</h1>
        <div className="flex space-x-4">
          {/* Add filters here later */}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={car.image}
              alt={car.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{car.name}</h3>
                <p className="text-2xl font-bold text-blue-600">₱{car.price}/day</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{car.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2" />
                  <span>{car.seats} seats</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Car className="h-5 w-5 mr-2" />
                  <span>{car.transmission}</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200">
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarListing;