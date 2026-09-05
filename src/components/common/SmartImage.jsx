import { useState } from 'react';

/* Image with a themed shimmer while loading and a graceful gradient
   fallback if the request ever fails — so nothing looks broken. */
export default function SmartImage({
  src,
  alt = '',
  ratio,
  className = '',
  imgClassName = '',
  eager = false,
  label,
  style,
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`smart-img ${className}`}
      style={{ ...(ratio ? { aspectRatio: ratio } : null), ...style }}
      data-loaded={loaded}
      data-failed={failed}
    >
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className={imgClassName}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div className="smart-img__fallback">
          <span>{label || alt || 'LuxuryStay'}</span>
        </div>
      )}
    </div>
  );
}
