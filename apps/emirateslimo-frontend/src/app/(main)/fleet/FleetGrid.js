'use client';
import { motion } from 'framer-motion';
import FleetCard from '@/components/FleetCard';

export default function FleetGrid({ vehicles = [] }) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
      }}
    >
      {vehicles.map((vehicle, i) => (
        <motion.div key={vehicle._id || i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <FleetCard index={i} vehicle={vehicle} />
        </motion.div>
      ))}
    </motion.div>
  );
}
