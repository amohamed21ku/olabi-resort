export function PageLoader() {
  return (
    <div className="adm-loader">
      <span className="adm-spinner" />
      <span>جارٍ التحميل...</span>
    </div>
  )
}

export function FullLoader() {
  return (
    <div className="adm-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="adm-loader"><span className="adm-spinner" /><span>جارٍ التحميل...</span></div>
    </div>
  )
}
