// The real logo is a wide horizontal lockup (mountain mark + wordmark), not a
// square icon — forcing it into a size×size box with objectFit:cover crops
// it. Fix height only and let width follow the image's own ratio, matching
// how the public site's Header renders the same file.
export default function Logo({ size = 40, style }) {
  return (
    <img
      src="/static/images/assets/olabi-logo.jpg"
      alt="منتجع العلبي"
      style={{ height: size, width: 'auto', maxWidth: size * 3, objectFit: 'contain', flexShrink: 0, ...style }}
    />
  )
}
