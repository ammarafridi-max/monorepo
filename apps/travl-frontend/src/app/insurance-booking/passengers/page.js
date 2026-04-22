import InsuranceLayout from '@/layouts/InsuranceLayout';
import PassengersForm from '@travel-suite/frontend-shared/components/v1/forms/PassengersForm';

export const metadata = {
  title: 'Passenger Details — TravelShield',
  description: 'Enter the details for all travellers on your policy.',
};

export default function PassengersPage() {
  return (
    <InsuranceLayout>
      <PassengersForm />
    </InsuranceLayout>
  );
}
