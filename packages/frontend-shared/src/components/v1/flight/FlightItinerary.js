import React from 'react';
import { format } from 'date-fns';
import { FaArrowRightLong } from 'react-icons/fa6';
import { formatISODuration } from '../../../utils/dates.js';

export default function FlightItinerary({ itinerary, airlineInfo }) {
  const imgSrc = `${process.env.NEXT_PUBLIC_BACKEND_URL}${airlineInfo.logo}`;

  return (
    <div className="w-full bg-white py-4 flex items-center justify-between lg:justify-center gap-9 lg:gap-10 nth-of-type-[2]:border-t nth-of-type-[2]:border-t-gray-300">
      <div className="w-[50px] h-[50px] flex flex-col justify-center align-middle">
        <img
          src={imgSrc || ''}
          alt={`${airlineInfo.commonName}`}
          className="object-contain text-[10px] "
        />
      </div>
      <div className="flex items-center justify-between lg:justify-center gap-3 lg:gap-8 font-nunito">
        <DepartureData itinerary={itinerary} />
        <Duration itinerary={itinerary} />
        <ReturnData itinerary={itinerary} />
      </div>
    </div>
  );
}

function DepartureData({ itinerary }) {
  return (
    <div className="w-[80px] text-left lg:text-center text-md lg:text-lg font-medium leading-4.5">
      <p className="mb-1 text-[13px] lg:text-[15px]">
        {itinerary?.segments[0].departure.iataCode}
      </p>
      <span className="text-[13px] lg:text-[14px] font-light">
        {format(new Date(itinerary?.segments[0].departure.at), 'dd MMM')}
      </span>
      <br />
      <span className="text-[13px] lg:text-[14px] font-light">
        {format(new Date(itinerary?.segments[0].departure.at), 'HH:mm')}
      </span>
    </div>
  );
}

function ReturnData({ itinerary }) {
  return (
    <div className="w-[80px] text-right lg:text-center text-md lg:text-lg font-medium leading-4.5">
      <p className="mb-1 text-[13px] lg:text-[15px]">
        {itinerary.segments[itinerary.segments.length - 1].arrival.iataCode}
      </p>
      <span className="text-[13px] lg:text-[14px] font-light">
        {format(
          new Date(
            itinerary.segments[itinerary.segments.length - 1].arrival.at,
          ),
          'dd MMM',
        )}
      </span>
      <br />
      <span className="text-[13px] lg:text-[14px] font-light">
        {format(
          new Date(
            itinerary.segments[itinerary.segments.length - 1].arrival.at,
          ),
          'HH:mm',
        )}
      </span>
    </div>
  );
}

function Duration({ itinerary }) {
  return (
    <div className="w-fit h-fit text-center text-gray-400 text-[12px] lg:text-sm font-nunito">
      <span>{formatISODuration(itinerary.duration)}</span>
      <p className="flex align-middle justify-center">
        <FaArrowRightLong />
      </p>
      <span>
        {itinerary.segments.length === 1 && 'Non-Stop'}
        {itinerary.segments.length === 2 &&
          `Stops in ${itinerary.segments.at(0).arrival.iataCode}`}
        {itinerary.segments.length >= 3 && 'Multiple Stops'}
      </span>
    </div>
  );
}
