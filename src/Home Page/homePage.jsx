import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import FeaturedRooms from './components/FeaturedRooms';
import FloorPlanNew from './components/FloorPlanNew';
import BookingSection from './components/BookingSection';
import Directions from './components/Directions';
import Experiences from './components/Experiences';
import KasabShowcase from './components/KasabShowcase';
import Footer from './components/Footer';
import './homePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Header />
      <Hero />
      <About />
      {/* <KasabShowcase /> */}
      <FeaturedRooms />
      <BookingSection />
      <FloorPlanNew />
      <Directions />
      {/* <Experiences /> */}
      {/* <Testimonials /> */}
      <Footer />
    </div>
  );
};

export default HomePage;