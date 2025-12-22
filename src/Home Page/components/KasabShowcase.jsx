import React, { useState, useRef } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import './KasabShowcase.css';

const KasabShowcase = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('attractions');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const videoRef = useRef(null);

  const kasabAttractions = [
    {
      id: 1,
      title: language === 'ar' ? 'رحلات القوارب' : 'Boat Tours',
      titleEn: 'Boat Tours',
      description: language === 'ar'
        ? 'استكشف الفيوردات الخلابة والمياه الفيروزية الصافية في رحلات قوارب لا تُنسى'
        : 'Explore stunning fjords and crystal-clear turquoise waters on unforgettable boat tours',
      image: '/static/images/kasab/boat-tour.jpg'
    },
    {
      id: 2,
      title: language === 'ar' ? 'مشاهدة الدلافين' : 'Dolphin Watching',
      titleEn: 'Dolphin Watching',
      description: language === 'ar'
        ? 'شاهد الدلافين البرية وهي تلعب في المياه النقية لمضيق مسندم'
        : 'Watch wild dolphins playing in the pristine waters of Musandam Fjords',
      image: '/static/images/kasab/dolphins.jpg'
    },
    {
      id: 3,
      title: language === 'ar' ? 'الغوص والسباحة' : 'Diving & Snorkeling',
      titleEn: 'Diving & Snorkeling',
      description: language === 'ar'
        ? 'اكتشف عالماً مذهلاً تحت الماء مع الشعاب المرجانية والحياة البحرية الملونة'
        : 'Discover an amazing underwater world with coral reefs and colorful marine life',
      image: '/static/images/kasab/diving.jpg'
    },
    {
      id: 4,
      title: language === 'ar' ? 'الجبال والتخييم' : 'Mountains & Camping',
      titleEn: 'Mountains & Camping',
      description: language === 'ar'
        ? 'استمتع بالتخييم في الجبال الشاهقة تحت سماء مليئة بالنجوم'
        : 'Enjoy camping in majestic mountains under star-filled skies',
      image: '/static/images/kasab/camping.jpg'
    },
    {
      id: 5,
      title: language === 'ar' ? 'القرى التقليدية' : 'Traditional Villages',
      titleEn: 'Traditional Villages',
      description: language === 'ar'
        ? 'اكتشف القرى العمانية التقليدية والثقافة الأصيلة في جبال مسندم'
        : 'Discover traditional Omani villages and authentic culture in Musandam mountains',
      image: '/static/images/kasab/village.jpg'
    },
    {
      id: 6,
      title: language === 'ar' ? 'الغروب الساحر' : 'Magical Sunsets',
      titleEn: 'Magical Sunsets',
      description: language === 'ar'
        ? 'شاهد أجمل غروب الشمس فوق مياه الخليج العربي'
        : 'Witness the most beautiful sunsets over the Arabian Gulf waters',
      image: '/static/images/kasab/sunset.jpg'
    }
  ];

  const mediaGallery = [
    {
      id: 1,
      type: 'video',
      src: '/static/images/kasab/kasab-fjords.mp4',
      thumbnail: '/static/images/kasab/fjords-thumb.jpg',
      title: language === 'ar' ? 'جولة في فيوردات مسندم' : 'Musandam Fjords Tour'
    },
    {
      id: 2,
      type: 'video',
      src: '/static/images/kasab/dolphin-tour.mp4',
      thumbnail: '/static/images/kasab/dolphin-thumb.jpg',
      title: language === 'ar' ? 'رحلة مشاهدة الدلافين' : 'Dolphin Watching Trip'
    },
    {
      id: 3,
      type: 'image',
      src: '/static/images/kasab/panorama-1.jpg',
      thumbnail: '/static/images/kasab/panorama-1.jpg',
      title: language === 'ar' ? 'إطلالة بانورامية' : 'Panoramic View'
    },
    {
      id: 4,
      type: 'video',
      src: '/static/images/kasab/underwater.mp4',
      thumbnail: '/static/images/kasab/underwater-thumb.jpg',
      title: language === 'ar' ? 'العالم تحت الماء' : 'Underwater World'
    },
    {
      id: 5,
      type: 'image',
      src: '/static/images/kasab/mountains-2.jpg',
      thumbnail: '/static/images/kasab/mountains-2.jpg',
      title: language === 'ar' ? 'جبال خصب' : 'Khasab Mountains'
    },
    {
      id: 6,
      type: 'image',
      src: '/static/images/kasab/beach-sunset.jpg',
      thumbnail: '/static/images/kasab/beach-sunset.jpg',
      title: language === 'ar' ? 'غروب على الشاطئ' : 'Beach Sunset'
    }
  ];

  const stats = [];

  const openLightbox = (media) => {
    setSelectedMedia(media);
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <section className="kasab-showcase" id="kasab">
      {/* Main Content */}
      <div className="kasab-content">
        {/* Section Header */}
        <div className="kasab-section-header">
          <h3>
            {language === 'ar'
              ? 'لماذا تختار خصب لعطلتك القادمة؟'
              : 'Why Choose Khasab for Your Next Getaway?'}
          </h3>
          <p>
            {language === 'ar'
              ? 'خصب هي جوهرة مخفية في شبه جزيرة مسندم، تقدم تجربة فريدة تجمع بين الطبيعة الخلابة والمغامرة والهدوء'
              : 'Khasab is a hidden gem in the Musandam Peninsula, offering a unique experience combining stunning nature, adventure, and tranquility'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="kasab-tabs">
          <button
            className={`tab-btn ${activeTab === 'attractions' ? 'active' : ''}`}
            onClick={() => setActiveTab('attractions')}
          >
            {language === 'ar' ? 'الأنشطة والمعالم' : 'Activities & Attractions'}
          </button>
          <button
            className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            {language === 'ar' ? 'معرض الصور والفيديو' : 'Photo & Video Gallery'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="kasab-tab-content">
          {/* Attractions Tab */}
          {activeTab === 'attractions' && (
            <div className="attractions-grid">
              {kasabAttractions.map((attraction, index) => (
                <div
                  key={attraction.id}
                  className="attraction-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <h4 className="attraction-title">{attraction.title}</h4>
                  <p className="attraction-desc">{attraction.description}</p>
                  <div className="attraction-hover-effect"></div>
                </div>
              ))}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="media-gallery">
              {mediaGallery.map((media, index) => (
                <div
                  key={media.id}
                  className={`media-item ${media.type}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => openLightbox(media)}
                >
                  <img
                    src={media.thumbnail}
                    alt={media.title}
                    loading="lazy"
                  />
                  {media.type === 'video' && (
                    <div className="play-overlay">
                      <span className="play-icon">▶</span>
                    </div>
                  )}
                  <div className="media-info">
                    <span className="media-title">{media.title}</span>
                    <span className="media-type">
                      {media.type === 'video'
                        ? (language === 'ar' ? 'فيديو' : 'Video')
                        : (language === 'ar' ? 'صورة' : 'Photo')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>×</button>
            {selectedMedia.type === 'video' ? (
              <video
                ref={videoRef}
                controls
                autoPlay
                className="lightbox-video"
              >
                <source src={selectedMedia.src} type="video/mp4" />
              </video>
            ) : (
              <img
                src={selectedMedia.src}
                alt={selectedMedia.title}
                className="lightbox-image"
              />
            )}
            <p className="lightbox-title">{selectedMedia.title}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default KasabShowcase;
