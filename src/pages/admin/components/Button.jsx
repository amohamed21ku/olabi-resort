// Every admin button goes through here so variants/sizes/touch-target stay
// consistent. Always render an icon+label (or pass iconOnly + title for the
// rare, clearly-labeled overflow trigger) — never a bare unlabeled icon.
export default function Button({
  variant = 'primary', size = 'md', icon, iconOnly = false,
  children, className = '', ...props
}) {
  const cls = [
    'adm-btn',
    `adm-btn--${variant}`,
    size === 'sm' ? 'adm-btn--sm' : '',
    iconOnly ? 'adm-btn--icon-only' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <button className={cls} {...props}>
      {icon}
      {!iconOnly && children}
    </button>
  )
}
