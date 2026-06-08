import ScaleLoader from 'react-spinners/ScaleLoader';

export default function Loading({ loading }) {
  return (
    <div className="bg-white opacity-80 fixed flex items-center justify-center left-0 top-0 h-screen w-screen">
      <ScaleLoader color="black" height={35} width={10} radius={2} margin={2} loading={loading} speedMultiplier={1} />
    </div>
  );
}
