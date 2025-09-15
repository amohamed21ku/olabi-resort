import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import FeaturedRooms from './components/FeaturedRooms';
import FloorPlan from './components/FloorPlan';
import BookingWidget from './components/BookingWidget';
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
       <BookingWidget />
      <FloorPlan />
     
      <Experiences />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default HomePage;