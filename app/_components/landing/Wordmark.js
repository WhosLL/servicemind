export default function Wordmark({ size = 18, className = '', style = {} }) {
  return (
    <span className={`wordmark ${className}`} style={{ fontSize: size, lineHeight: 1, ...style }}>
      Service<span className="wordmark__m">M</span>ind
    </span>
  )
}
