import React from 'react';

const Directions = () => {
  return (
    <section className="directions-section" id="directions">
      <div className="directions-container">
        <div className="directions-header">
          <h2>How to Get Here</h2>
          <p>Find your way to Olabi Resort in the beautiful mountains of Kasab</p>
        </div>

        <div className="directions-content">
          <div className="route-info">
            <div className="route-option">
              <h3>From Damascus</h3>
              <div className="route-details">
                <div className="route-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Take Highway M5 North</h4>
                    <p>Drive approximately 350km from Damascus towards Lattakia</p>
                  </div>
                </div>
                <div className="route-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Exit toward Kasab</h4>
                    <p>Take the exit for Kasab/Turkey Border (Exit 15)</p>
                  </div>
                </div>
                <div className="route-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Follow signs to Olabi Resort</h4>
                    <p>Continue for 5km following resort signage</p>
                  </div>
                </div>
              </div>
              <div className="route-stats">
                <div className="stat">
                  <span className="stat-value">5.5</span>
                  <span className="stat-label">Hours</span>
                </div>
                <div className="stat">
                  <span className="stat-value">380</span>
                  <span className="stat-label">Kilometers</span>
                </div>
              </div>
            </div>

            <div className="route-option">
              <h3>From Lattakia</h3>
              <div className="route-details">
                <div className="route-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Take Coastal Highway North</h4>
                    <p>Drive north along the Mediterranean coast</p>
                  </div>
                </div>
                <div className="route-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Turn inland at Kasab junction</h4>
                    <p>Follow mountain road towards Kasab village</p>
                  </div>
                </div>
                <div className="route-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Arrive at resort</h4>
                    <p>Resort entrance will be on your right</p>
                  </div>
                </div>
              </div>
              <div className="route-stats">
                <div className="stat">
                  <span className="stat-value">1.5</span>
                  <span className="stat-label">Hours</span>
                </div>
                <div className="stat">
                  <span className="stat-value">65</span>
                  <span className="stat-label">Kilometers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="directions-video">
            <h3>Visual Route Guide</h3>
            <div className="video-container">
              <div className="video-placeholder">
                <div className="play-button">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="5,3 19,12 5,21"></polygon>
                  </svg>
                </div>
                <div className="video-info">
                  <h4>Scenic Drive to Olabi Resort</h4>
                  <p>Watch our guided tour through the beautiful mountain roads of Kasab</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="additional-info">
          <div className="info-card">
            <h4>📍 GPS Coordinates</h4>
            <p>35.9167° N, 35.9833° E</p>
          </div>
          <div className="info-card">
            <h4>🚗 Parking</h4>
            <p>Free valet parking available</p>
          </div>
          <div className="info-card">
            <h4>✈️ Airport Transfer</h4>
            <p>Private transfer service available from Lattakia Airport</p>
          </div>
          <div className="info-card">
            <h4>📞 Need Help?</h4>
            <p>Call us: +963 41 123-4567</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Directions;