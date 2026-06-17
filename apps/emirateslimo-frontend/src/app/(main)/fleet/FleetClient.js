'use client';

import { motion } from 'framer-motion';
import { useGetVehicles } from '@travel-suite/frontend-shared/hooks/vehicles/useGetVehicles';
import Container from '@/components/Container';
import FleetCard from '@/components/FleetCard';
import PrimarySection from '@/components/PrimarySection';
import PrimaryLink from '@/components/PrimaryLink';

export default function FleetClient() {
  const { vehicles = [], isLoadingVehicles } = useGetVehicles();

  return (
    <PrimarySection className="py-15 lg:py-20">
      <Container>
        {isLoadingVehicles ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vehicles?.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {vehicles.map((veh, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <FleetCard index={i} vehicle={veh} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-center text-gray-500 font-light py-10">
            No vehicles available at the moment. Please check back soon.
          </p>
        )}

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <PrimaryLink href="/dubai-airport-transfer">Book Airport Transfer</PrimaryLink>
          <PrimaryLink href="/hourly-chauffeur">Book Hourly Chauffeur</PrimaryLink>
        </div>
      </Container>
    </PrimarySection>
  );
}
