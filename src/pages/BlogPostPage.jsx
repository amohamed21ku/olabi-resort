import { useParams, Link, Navigate } from 'react-router-dom'
import { useLanguage } from '../App'
import { getPost, blogPosts } from '../data/blog'
import Seo from '../components/Seo'
import { FiArrowRight, FiArrowLeft, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { isRTL } = useLanguage()
  const post = getPost(slug)

  if (!post) return <Navigate to="/blog" replace />

  const Back = isRTL ? FiChevronRight : FiChevronLeft
  const Arrow = isRTL ? FiArrowLeft : FiArrowRight
  const title = isRTL ? post.titleAr : post.titleEn
  const body = isRTL ? post.bodyAr : post.bodyEn
  const description = isRTL ? post.excerptAr : post.excerptEn
  const url = `https://olabiresort.com/blog/${post.slug}`

  const others = blogPosts.filter(p => p.slug !== post.slug).slice(0, 3)

  const posting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: `https://olabiresort.com${post.cover}`,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: isRTL ? 'ar' : 'en',
    keywords: post.keywords,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'Olabi Resort' },
    publisher: {
      '@type': 'Organization',
      name: 'Olabi Resort',
      logo: { '@type': 'ImageObject', url: 'https://olabiresort.com/static/images/assets/olabi-logo.jpg' },
    },
  }
  // Some posts carry extra schema (e.g. a TouristDestination guide).
  const jsonLd = post.extraSchema ? [posting, post.extraSchema] : posting

  return (
    <div style={{ background: 'var(--cream)' }}>
      <Seo title={`${title} | ${isRTL ? 'منتجع العلبي' : 'Olabi Resort'}`}
        description={description} path={`/blog/${post.slug}`} image={post.cover}
        lang={isRTL ? 'ar' : 'en'} jsonLd={jsonLd} />

      {/* Cover */}
      <section style={{ position: 'relative', height: '48vh', minHeight: 320, overflow: 'hidden', background: '#07130a' }}>
        <img src={post.cover} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,19,10,0.35) 0%, rgba(7,19,10,0.8) 100%)' }} />
        <div className="container" style={{
          position: 'relative', zIndex: 2, height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 40,
          textAlign: isRTL ? 'right' : 'left',
        }}>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, color: '#fff', lineHeight: 1.18, maxWidth: 760,
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)', textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            marginLeft: isRTL ? 'auto' : 0,
          }}>
            {title}
          </h1>
        </div>
      </section>

      {/* Article */}
      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <Link to="/blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--terracotta)',
            fontSize: 14, fontWeight: 700, marginBottom: 28,
          }}>
            <Back size={16} />
            {isRTL ? 'كل المقالات' : 'All articles'}
          </Link>

          <article style={{ textAlign: isRTL ? 'right' : 'left' }}>
            {body.map((block, i) =>
              block.h2 ? (
                <h2 key={i} style={{
                  fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, color: 'var(--ink)',
                  margin: '32px 0 12px', lineHeight: 1.3,
                  fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
                }}>
                  {block.h2}
                </h2>
              ) : (
                <p key={i} style={{ fontSize: 17, color: 'var(--charcoal)', lineHeight: 1.9, marginBottom: 16 }}>
                  {block.p}
                </p>
              )
            )}
          </article>

          {/* CTA */}
          <div style={{
            marginTop: 44, padding: '28px 30px', borderRadius: 'var(--radius-lg)',
            background: 'var(--olive-light)', border: '1px solid rgba(107, 124, 74, 0.28)',
            textAlign: isRTL ? 'right' : 'left',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--olive-dark)', marginBottom: 8,
              fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>
              {isRTL ? 'خطّط لإقامتك في منتجع العلبي' : 'Plan your stay at Olabi Resort'}
            </h3>
            <p style={{ fontSize: 15.5, color: 'var(--charcoal)', lineHeight: 1.8, marginBottom: 18 }}>
              {isRTL
                ? 'غرف وأجنحة فاخرة في قلب جبال كسب، بإطلالات خلابة وإنترنت ستارلينك مجاني. احجز مباشرة لأفضل سعر.'
                : 'Luxury rooms and suites in the heart of the Kasab mountains, with stunning views and free Starlink internet. Book directly for the best rate.'}
            </p>
            <Link to="/#rooms" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {isRTL ? 'استعرض الغرف' : 'Explore rooms'}
              <Arrow size={15} />
            </Link>
          </div>

          {/* Related */}
          {others.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 18,
                textAlign: isRTL ? 'right' : 'left',
                fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)' }}>
                {isRTL ? 'اقرأ أيضاً' : 'Keep reading'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {others.map(p => (
                  <Link key={p.slug} to={`/blog/${p.slug}`} style={{
                    padding: '16px 18px', borderRadius: 'var(--radius-md)', background: 'var(--white)',
                    border: '1px solid rgba(221, 208, 184, 0.72)', color: 'var(--ink)',
                    fontSize: 15, fontWeight: 600, lineHeight: 1.4, textAlign: isRTL ? 'right' : 'left',
                    fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-heading)',
                  }}>
                    {isRTL ? p.titleAr : p.titleEn}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
