import { Link } from 'react-router-dom'
import { useLanguage } from '../App'
import { withLangPrefix } from '../utils/i18nPath'
import { blogPosts } from '../data/blog'
import Seo from '../components/Seo'
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi'

export default function BlogPage() {
  const { isRTL, withLang } = useLanguage()
  const lang = isRTL ? 'ar' : 'en'
  const Arrow = isRTL ? FiArrowLeft : FiArrowRight

  const title = isRTL
    ? 'مدونة كسب | دليل السفر والإقامة — منتجع العلبي'
    : 'Kasab Travel Blog | Guides to Hotels & Things to Do — Olabi Resort'
  const description = isRTL
    ? 'أدلة سفر عن كسب: أفضل الفنادق والمنتجعات، الأنشطة والأماكن السياحية، كيفية الوصول، وأفضل وقت للزيارة — من منتجع العلبي.'
    : 'Kasab travel guides: the best hotels and resorts, things to do, how to get there, and the best time to visit — from Olabi Resort.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: title,
    url: `https://olabiresort.com${withLangPrefix('/blog', lang)}`,
    inLanguage: lang,
    publisher: { '@type': 'Organization', name: 'Olabi Resort' },
    blogPost: blogPosts.map(p => ({
      '@type': 'BlogPosting',
      headline: isRTL ? p.titleAr : p.titleEn,
      url: `https://olabiresort.com${withLangPrefix(`/blog/${p.slug}`, lang)}`,
      datePublished: p.date,
    })),
  }

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      <Seo title={title} description={description} path="/blog" lang={isRTL ? 'ar' : 'en'} jsonLd={jsonLd} />

      <section className="section">
        <div className="container" style={{ maxWidth: 1040 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p className="section-label">{isRTL ? 'المدونة' : 'The Journal'}</p>
            <h1 className="section-title" style={{ margin: '0 auto 14px' }}>
              {isRTL ? 'دليل كسب للسفر والإقامة' : 'Your Guide to Kasab'}
            </h1>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              {isRTL
                ? 'كل ما تحتاج معرفته لزيارة كسب — الفنادق والأنشطة والطريق وأفضل المواسم.'
                : 'Everything you need to plan a trip to Kasab — hotels, things to do, directions and the best seasons.'}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 28,
          }}>
            {blogPosts.map(post => (
              <Link
                key={post.slug}
                to={withLang(`/blog/${post.slug}`)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(35, 48, 31, 0.08)',
                  border: '1px solid rgba(221, 208, 184, 0.72)',
                  textAlign: isRTL ? 'right' : 'left',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 18px 40px rgba(35, 48, 31, 0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(35, 48, 31, 0.08)' }}
              >
                <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: '#e8e0d0' }}>
                  <img src={post.cover} alt={isRTL ? post.titleAr : post.titleEn} loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '22px 22px 26px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h2 style={{
                    fontSize: 19, fontWeight: 700, lineHeight: 1.35, color: 'var(--ink)',
                    marginBottom: 10,
                    fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
                  }}>
                    {isRTL ? post.titleAr : post.titleEn}
                  </h2>
                  <p style={{ fontSize: 14.5, color: 'var(--charcoal)', lineHeight: 1.7, marginBottom: 16, flex: 1 }}>
                    {isRTL ? post.excerptAr : post.excerptEn}
                  </p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    color: 'var(--terracotta)', fontSize: 14, fontWeight: 700,
                  }}>
                    {isRTL ? 'اقرأ المزيد' : 'Read more'}
                    <Arrow size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
