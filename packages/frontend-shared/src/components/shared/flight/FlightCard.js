"use client";

import React, { useContext } from "react";
import FlightForm from "../../forms/v1/FlightForm.js";
import FlightItinerary from "./FlightItinerary.js";
import PrimaryButtonOutline from "../../ui/v1/PrimaryButtonOutline.js";
import { useDummyTicketPricing } from "../../../hooks/pricing/useDummyTicketPricing.js";
import { getTicketPriceByValidity } from "../../../utils/dummyTicketPricing.js";
import { useCurrency } from "../../../contexts/CurrencyContext.js";
import { TicketContext } from "../../../contexts/TicketContext.js";

export default function FlightCard({ flight, isExpanded, onSelectFlight }) {
  const { pricing } = useDummyTicketPricing();
  const { selectedCurrency, formatMoney } = useCurrency();
  const { ticketValidity } = useContext(TicketContext);

  const basePrice = getTicketPriceByValidity(pricing, ticketValidity);
  const displayPrice = formatMoney(basePrice, "AED");

  return (
    <div className="w-full rounded-2xl bg-white mb-5 p-3 lg:p-3.75 transition-[box-shadow_0.3s_ease] shadow-(--flight-shadow) hover:shadow-(--flight-shadow-hover)">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-center gap-1 lg:gap-7.5">
        <div className="w-full flex-1 px-3">
          {flight?.itineraries?.map((itinerary, i) => (
            <FlightItinerary
              key={i}
              itinerary={itinerary}
              airlineInfo={flight.airlineDetails[0]}
            />
          ))}
        </div>

        <div className="w-full lg:w-1/4 flex justify-between lg:block pt-1 lg:pt-2.5 lg:border-t-0 px-3">
          <div className="w-[40%] lg:w-full flex flex-col lg:flex-row gap-1 items-baseline justify-center font-nunito text-left lg:text-center lg:py-2">
            <p className="text-lg font-medium text-black mb-[-8px]">
              {displayPrice.code || selectedCurrency?.code || "AED"}{" "}
              {displayPrice.value}
            </p>
            <p className="text-sm font-light text-gray-400">/ person</p>
          </div>
          <button
            className={`w-[30%] lg:w-full rounded-full py-2 text-sm cursor-pointer duration-300 ${isExpanded ? "bg-black text-white" : "bg-gray-200 text-black hover:bg-gray-300"}`}
            disabled={isExpanded}
            onClick={onSelectFlight}
          >
            {isExpanded ? "Selected" : "Select Flight"}
          </button>
        </div>
      </div>
      {isExpanded && <FlightForm flight={flight} />}
    </div>
  );
}
