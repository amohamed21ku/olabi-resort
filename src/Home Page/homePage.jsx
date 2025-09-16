import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import FeaturedRooms from './components/FeaturedRooms';
import FloorPlan from './components/FloorPlan';
import BookingSection from './components/BookingSection';
import Directions from './components/Directions';
import Experiences from './components/Experiences';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import './homePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Header />
      <Hero />
      <About />
      <FeaturedRooms />
      <BookingSection />
      <FloorPlan />
       <Directions />
      {/* <Experiences /> */}
      {/* <Testimonials /> */}
      <Footer />
    </div>
  );
};

export default HomePage;