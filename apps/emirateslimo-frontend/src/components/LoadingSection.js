import ScaleLoader from 'react-spinners/ScaleLoader';
import PrimarySection from './PrimarySection';

export default function LoadingSection() {
  return (
    <PrimarySection className="bg-gray-100 h-100 animate-pulse flex items-center justify-center">
      <ScaleLoader color="black" height={35} width={10} radius={2} margin={2} loading={true} speedMultiplier={1} />
    </PrimarySection>
  );
}
