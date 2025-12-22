import React from 'react';

const FeaturedRooms = () => {

  const rooms = [
    {
      id: 1,
      name: 'Mountain View Room',
      price: '45,000 SYP',
      period: 'per night',
      image: 'mountain-suite',
      features: ['King Bed', 'Mountain View', 'Private Balcony', 'Spa Bath']
    },
    {
      id: 2,
      name: 'Honeymoon Suite',
      price: '85,000 SYP',
      period: 'per night',
      image: 'presidential-villa',
      features: ['3 Bedrooms', 'Private Pool', 'Personal Chef', 'Butler Service']
    },
    {
      id: 3,
      name: 'Garden Retreat',
      price: '32,000 SYP',
      period: 'per night',
      image: 'garden-apartment',
      features: ['Garden View', 'Kitchenette', 'Living Area', 'Terrace']
    },
    {
      id: 4,
      name: 'Penthouse Suite',
      price: '120,000 SYP',
      period: 'per night',
      image: 'luxury-penthouse',
      features: ['Panoramic Views', 'Private Elevator', 'Rooftop Terrace', 'Jacuzzi']
    }
  ];

  return (
    <section className="py-20 lg:py-24 bg-white" id="rooms">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4 text-[var(--primary-ocean)]">
            Featured Accommodations
          </h2>
          <div className="w-24 h-1 mx-auto rounded-full mb-4" style={{ background: 'var(--gradient-gold)' }} />
          <p className="text-lg text-[var(--medium-gray)] max-w-2xl mx-auto">
            Discover our handpicked selection of luxurious rooms designed for ultimate comfort
          </p>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          {rooms.map((room, index) => (
            <div
              key={room.id}
              className="group bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3"
              style={{
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Room Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src="/static/images/assets/featured-room.png"
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white font-medium">{room.name}</span>
                </div>
                {/* Featured Badge */}
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: 'var(--gradient-gold)',
                    color: 'var(--charcoal)'
                  }}>
                  Featured
                </div>
              </div>

              {/* Room Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[var(--primary-ocean)] mb-3">
                  {room.name}
                </h3>

                {/* Features */}
                <ul className="flex flex-wrap gap-2 mb-4 min-h-[50px]">
                  {room.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx}
                      className="px-2.5 py-1 bg-[var(--light-gray)] rounded-full text-xs text-[var(--medium-gray)]">
                      {feature}
                    </li>
                  ))}
                  {room.features.length > 3 && (
                    <li className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ background: 'var(--gradient-ocean)' }}>
                      +{room.features.length - 3} more
                    </li>
                  )}
                </ul>

                {/* Price & CTA */}
                <div className="flex flex-col gap-3 mt-auto">
                  <div className="text-center">
                    <span className="text-xl font-bold text-[var(--luxury-gold)] block">
                      {room.price}
                    </span>
                    <span className="text-xs text-[var(--medium-gray)]">
                      {room.period}
                    </span>
                  </div>

                  <button className="w-full py-2.5 px-4 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 group-hover:shadow-lg"
                    style={{
                      background: 'var(--gradient-ocean)',
                      boxShadow: 'var(--shadow-ocean)'
                    }}>
                    Book Now
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button className="px-8 py-4 rounded-full font-bold text-[var(--primary-ocean)] border-2 border-[var(--primary-ocean)] bg-transparent hover:bg-gradient-to-r hover:from-[var(--primary-ocean)] hover:to-[var(--secondary-ocean)] hover:text-white hover:border-transparent transition-all duration-300 inline-flex items-center gap-2 hover:-translate-y-1"
            style={{ boxShadow: 'hover:var(--shadow-ocean)' }}>
            View All Accommodations
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedRooms;
