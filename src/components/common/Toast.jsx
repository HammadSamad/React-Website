import { AnimatePresence, motion } from 'framer-motion';
import { useData } from '../../context/DataContext.jsx';
import Icon from './Icon.jsx';

export default function Toast() {
  const { toast } = useData();
  return (
    <div className="toast-wrap" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`toast ${toast.kind === 'warn' ? 'toast--warn' : ''}`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            role="status"
          >
            <Icon
              name={toast.kind === 'warn' ? 'info' : 'circleCheck'}
              size={18}
              className="toast__icon"
            />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
