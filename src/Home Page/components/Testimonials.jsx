import React, { useState, useEffect } from 'react';

const Testimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      location: 'New York, USA',
      rating: 5,
      text: 'Olabi Resort exceeded all our expectations. The attention to detail, luxurious amenities, and breathtaking views made our honeymoon absolutely perfect. The staff went above and beyond to make every moment special.',
      image: 'sarah-johnson'
    },
    {
      id: 2,
      name: 'Michel Dubois',
      location: 'Paris, France',
      rating: 5,
      text: 'An extraordinary experience from start to finish. The spa treatments were world-class, and the dining was exceptional. This is luxury hospitality at its finest. We cannot wait to return.',
      image: 'michel-dubois'
    },
    {
      id: 3,
      name: 'Ahmed Hassan',
      location: 'Dubai, UAE',
      rating: 5,
      text: 'The perfect blend of natural beauty and sophisticated luxury. Every detail has been thoughtfully designed. Our family vacation here created memories that will last a lifetime.',
      image: 'ahmed-hassan'
    },
    {
      id: 4,
      name: 'Emily Chen',
      location: 'Singapore',
      rating: 5,
      text: 'Olabi Resort set a new standard for luxury travel for me. The personalized service, stunning accommodations, and unique experiences made this trip truly unforgettable.',
      image: 'emily-chen'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="section-header">
          <h2>What Our Guests Say</h2>
          <p>Hear from those who have experienced the magic of Olabi Resort</p>
        </div>

        <div className="testimonials-carousel">
          <div className="testimonial-content">
            <div className="testimonial-card">
              <div className="stars">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>

              <blockquote>
                "{testimonials[currentTestimonial].text}"
              </blockquote>

              <div className="testimonial-author">
                <div className="author-image">
                  <div className="image-placeholder" data-image={testimonials[currentTestimonial].image}></div>
                </div>
                <div className="author-info">
                  <h4>{testimonials[currentTestimonial].name}</h4>
                  <p>{testimonials[currentTestimonial].location}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="carousel-controls">
            <button className="carousel-btn prev" onClick={prevTestimonial}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            <div className="carousel-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>

            <button className="carousel-btn next" onClick={nextTestimonial}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="testimonials-stats">
          <div className="stat-item">
            <h3>4.9/5</h3>
            <p>Guest Rating</p>
          </div>
          <div className="stat-item">
            <h3>98%</h3>
            <p>Return Guests</p>
          </div>
          <div className="stat-item">
            <h3>1000+</h3>
            <p>5-Star Reviews</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;