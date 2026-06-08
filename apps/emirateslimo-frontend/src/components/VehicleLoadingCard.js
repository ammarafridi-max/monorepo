import { MdOutlineLuggage, MdOutlineMan2, MdOutlineStar } from 'react-icons/md';

export default function VehicleLoadingCard() {
  return (
    <div className="grid lg:grid-cols-[3.5fr_8.5fr] items-start gap-5 rounded-xl bg-white p-5 shadow-md animate-pulse ring-1 ring-primary-900/10">
      <div className="relative hidden lg:block bg-gray-200 w-full aspect-video rounded-xl overflow-hidden"></div>
      <div className="flex flex-col justify-between h-full">
        <div className="grid grid-cols-[8.8fr_3.2fr] items-center gap-3 lg:block mb-5">
          <div>
            <div className="flex items-center w-50 h-[17px] lg:h-[20px] font-medium lg:font-normal bg-gray-200 mb-2"></div>
            <div className="w-20 h-[15px] bg-gray-200"></div>
          </div>
          <div className="block lg:hidden w-full bg-gray-200 rounded-lg aspect-video"></div>
        </div>
        <div className="w-[90%] h-[14px] bg-gray-200 mb-1"></div>
        <div className="w-[60%] h-[14px] bg-gray-200 mb-4"></div>
        <div className="flex flex-wrap items-center gap-2 mb-0">
          <div>
            <div className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-md text-gray-900 transition-colors">
              <MdOutlineLuggage className="text-[14px]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-md text-gray-900 transition-colors">
              <MdOutlineMan2 className="text-[14px]" />
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-md text-gray-900 transition-colors">
            <MdOutlineStar className="text-[14px]" />
          </div>
        </div>
      </div>
      {/* <div>
        <div className="w-50 lg:h-[20px] bg-primary-200 mb-2"></div>
        <div className="w-15 h-[16px] bg-primary-200 mb-4"></div>
        <div className="w-full h-[14px] bg-primary-200 mb-1"></div>
        <div className="w-[60%] h-[14px] bg-primary-200 mb-4"></div>
      </div> */}
    </div>
  );
}
