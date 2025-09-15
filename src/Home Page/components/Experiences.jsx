import React from 'react';

const Experiences = () => {
  const experiences = [
    {
      id: 1,
      title: 'Spa & Wellness',
      description: 'Rejuvenate your body and mind with our world-class spa treatments',
      image: 'spa-wellness',
      features: ['Hot Stone Massage', 'Aromatherapy', 'Yoga Sessions', 'Meditation Garden']
    },
    {
      id: 2,
      title: 'Fine Dining',
      description: 'Experience culinary excellence with our Michelin-starred restaurants',
      image: 'fine-dining',
      features: ['Michelin Star Chef', 'Farm-to-Table', 'Wine Cellar', 'Private Dining']
    },
    {
      id: 3,
      title: 'Adventure & Sports',
      description: 'Explore the mountains with guided adventures and exciting activities',
      image: 'adventure-sports',
      features: ['Mountain Hiking', 'Rock Climbing', 'Helicopter Tours', 'Zip Lining']
    },
    {
      id: 4,
      title: 'Cultural Immersion',
      description: 'Discover local traditions and authentic cultural experiences',
      image: 'cultural',
      features: ['Local Crafts', 'Traditional Music', 'Historical Tours', 'Cooking Classes']
    }
  ];

  return (
    <section className="experiences-section" id="experiences">
      <div className="experiences-container">
        <div className="section-header">
          <h2>Unforgettable Experiences</h2>
          <p>Create lasting memories with our curated collection of unique activities</p>
        </div>

        <div className="experiences-grid">
          {experiences.map((experience) => (
            <div key={experience.id} className="experience-card">
              <div className="experience-image">
                <div className="image-placeholder" data-image={experience.image}>
                  <div className="experience-overlay">
                    <div className="overlay-content">
                      <h3>{experience.title}</h3>
                      <p>{experience.description}</p>
                      <ul className="experience-features">
                        {experience.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                      <button className="experience-btn">
                        Learn More
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="experiences-showcase">
          <div className="showcase-item large">
            <div className="showcase-content">
              <h3>Wellness Retreat Packages</h3>
              <p>Transform your stay into a holistic wellness journey with our specially designed retreat packages.</p>
              <button className="showcase-btn">
                Explore Packages
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
            <div className="showcase-image" data-image="wellness-retreat"></div>
          </div>

          <div className="showcase-item">
            <div className="showcase-content">
              <h4>Private Events</h4>
              <p>Host unforgettable celebrations in our exclusive venues</p>
              <button className="showcase-btn-small">
                Learn More
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experiences;