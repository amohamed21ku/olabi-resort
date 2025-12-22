import React from 'react';

const Directions = () => {
  const routes = [
    {
      from: 'From Damascus',
      steps: [
        { title: 'Take Highway M5 North', desc: 'Drive approximately 350km from Damascus towards Lattakia' },
        { title: 'Exit toward Kasab', desc: 'Take the exit for Kasab/Turkey Border (Exit 15)' },
        { title: 'Follow signs to Olabi Resort', desc: 'Continue for 5km following resort signage' }
      ],
      stats: [
        { value: '5.5', label: 'Hours' },
        { value: '380', label: 'Kilometers' }
      ]
    },
    {
      from: 'From Lattakia',
      steps: [
        { title: 'Take Coastal Highway North', desc: 'Drive north along the scenic coastal route' },
        { title: 'Turn to Kasab exit', desc: 'Follow mountain road towards Kasab' },
        { title: 'Arrive at resort', desc: 'Resort entrance will be on your right' }
      ],
      stats: [
        { value: '1.5', label: 'Hours' },
        { value: '65', label: 'Kilometers' }
      ]
    }
  ];

  return (
    <section className="py-20 lg:py-24" id="directions"
      style={{ background: 'linear-gradient(135deg, var(--cream) 0%, var(--beige) 100%)' }}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4 text-[var(--deep-ocean)]">
            How to Get Here
          </h2>
          <div className="w-24 h-1 mx-auto rounded-full mb-4" style={{ background: 'var(--gradient-gold)' }} />
          <p className="text-lg text-[var(--medium-gray)] max-w-2xl mx-auto">
            Find your way to Olabi Resort in the beautiful mountains of Kasab
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Route Options */}
          <div className="lg:col-span-2 space-y-6">
            {routes.map((route, routeIndex) => (
              <div key={routeIndex}
                className="bg-white rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:-translate-y-1"
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  border: '2px solid rgba(45, 106, 79, 0.1)'
                }}>

                <h3 className="text-xl lg:text-2xl font-semibold text-[var(--deep-ocean)] mb-6">
                  {route.from}
                </h3>

                {/* Steps */}
                <div className="space-y-4 mb-6">
                  {route.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex gap-4 items-start">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'var(--gradient-nature)' }}>
                        {stepIndex + 1}
                      </span>
                      <div>
                        <h4 className="font-semibold text-[var(--charcoal)] mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-[var(--medium-gray)]">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex gap-8 pt-4 border-t border-[var(--light-gray)]">
                  {route.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="text-center">
                      <span className="block text-2xl font-bold text-[var(--primary-green)]">
                        {stat.value}
                      </span>
                      <span className="text-sm text-[var(--medium-gray)]">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Video Guide */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1"
              style={{
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                border: '2px solid rgba(45, 106, 79, 0.1)'
              }}>

              <h3 className="text-lg font-semibold text-[var(--deep-ocean)] mb-4">
                Visual Route Guide
              </h3>

              <div className="rounded-xl overflow-hidden cursor-pointer group">
                <div className="relative h-48 flex flex-col items-center justify-center text-white"
                  style={{
                    background: 'linear-gradient(135deg, var(--deep-ocean) 0%, rgba(44, 91, 92, 0.9) 100%)'
                  }}>

                  {/* Play Button */}
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>

                  <div className="text-center px-4">
                    <h4 className="font-semibold mb-1">Drive to Olabi Resort</h4>
                    <p className="text-sm text-white/80">
                      Watch our guided tour through the beautiful mountain roads
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-[var(--light-gray)]">
                <p className="text-sm text-[var(--medium-gray)] mb-3">
                  Need help finding us?
                </p>
                <a href="tel:+905528957541"
                  className="flex items-center gap-2 text-[var(--primary-ocean)] font-semibold hover:text-[var(--secondary-ocean)] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +90 552 895 75 41
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Directions;
