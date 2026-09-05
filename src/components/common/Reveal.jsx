import { motion, useReducedMotion } from 'framer-motion';

/* Scroll-triggered reveal. Respects prefers-reduced-motion.
   Usage: <Reveal><h2>…</h2></Reveal>  or  <Reveal as="li" delay={0.1}> */
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  y = 26,
  once = true,
  amount = 0.25,
  duration = 0.8,
  className = '',
  style,
  ...rest
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/* Staggered container + item helpers */
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

/* Reveal words one-by-one (for hero headlines) */
export function Words({ text, className = '', delay = 0, stagger = 0.08 }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  if (reduce) return <span className={className}>{text}</span>;
  return (
    <span className={className} style={{ display: 'inline' }}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}
        >
          <motion.span
            style={{ display: 'inline-block' }}
            initial={{ y: '110%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.9, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
