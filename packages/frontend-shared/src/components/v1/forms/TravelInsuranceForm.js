"use client";

import { Tooltip } from "react-tooltip";
import { FaCircle, FaInfo } from "react-icons/fa";
import { compareDateOnly } from "../../../utils/dates";
import { InsuranceContext } from "../../../contexts/InsuranceContext.js";
import { useContext, Fragment } from "react";
import { useLocalStorage } from "../../../hooks/general/useLocalStorage";
import { pixelLead } from "../../../utils/pixel";
import { trackQuoteStarted } from "../../../utils/analytics";
import { todayDateOnly } from "../../../utils/dates";
import Label from "../form-elements/Label";
import DatePicker from "../form-elements/DatePicker";
import SearchableSelect from "../form-elements/SearchableSelect";
import Counter from "../form-elements/Counter";
import PrimaryButton from "../ui/PrimaryButton";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function TravelInsuranceForm() {
  const {
    REGIONS,
    ageCategories,
    journeyType,
    setJourneyType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    region,
    setRegion,
    group,
    quantity,
    handleQuantityChange,
    setSchemeId,
    setQuoteId,
  } = useContext(InsuranceContext);
  const { updateLocalStorage } = useLocalStorage();
  const router = useRouter();

  const totalTravellers =
    quantity.adults + quantity.children + quantity.seniors;

  function validateForm() {
    if (!startDate || !endDate || !region?.id) {
      toast.error("Please select travel dates and region");
      return false;
    }

    if (compareDateOnly(startDate, endDate) > 0) {
      toast.error("End date must be after start date");
      return false;
    }

    if (totalTravellers === 0) {
      toast.error("Please add at least one traveller");
      return false;
    }

    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setSchemeId(null);
    setQuoteId(null);

    updateLocalStorage("travelInsurance", {
      journeyType,
      startDate,
      endDate,
      region,
      group,
      quantity,
      schemeId: null,
      quoteId: null,
    });

    trackQuoteStarted({
      journeyType,
      startDate,
      endDate,
      region: region?.name,
      adults: quantity.adults,
      children: quantity.children,
      seniors: quantity.seniors,
    });

    pixelLead();

    router.push("/insurance-booking/quote");
  }

  return (
    <form className="m-0 py-7 px-4 md:p-6 rounded-2xl shadow-md bg-white">
      <div className="flex gap-5">
        {[
          { id: "single", label: "Single" },
          { id: "annual", label: "Annual" },
        ].map((tripType) => (
          <button
            key={tripType.id}
            type="button"
            onClick={() => setJourneyType(tripType.id)}
            className="text-[14.5px] w-fit flex items-center mb-5 cursor-pointer font-light"
          >
            <FaCircle
              className={`mr-2 p-0.75 text-lg rounded-full border border-black ${
                journeyType === tripType.id ? "text-black" : "text-transparent"
              }`}
            />
            {tripType.label}
          </button>
        ))}
      </div>

      <div className="block md:flex gap-3 md:gap-3.5">
        <div className="w-full md:w-1/2 flex flex-col gap-1 mb-3 md:mb-3">
          <Label htmlFor="startDate">Start Date</Label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            minDate={todayDateOnly()}
            placeholder="Select start date"
          />
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-1 mb-3 md:mb-3">
          <Label htmlFor="endDate">End Date</Label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            minDate={startDate || todayDateOnly()}
            placeholder="Select end date"
          />
        </div>
      </div>

      <div className="block md:flex gap-3 md:gap-3.5">
        <div className="w-full flex flex-col gap-1 mb-3 md:mb-3">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="region">Destination</Label>
            <span
              data-tooltip-id="region-tooltip"
              data-tooltip-content="This is your travel destination region, not where you're from. Select the region you're travelling to."
              className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <FaInfo className="text-gray-500" style={{ fontSize: "8px" }} />
            </span>
            <Tooltip
              id="region-tooltip"
              place="top"
              style={{
                maxWidth: "220px",
                fontSize: "12px",
                lineHeight: "1.5",
                borderRadius: "8px",
              }}
            />
          </div>
          <SearchableSelect
            items={REGIONS}
            value={region}
            placeholder="Select a region…"
            onChange={setRegion}
            minSearchLength={0}
          />
          {/* {region?.description && (
            <p className="text-xs text-gray-400 pl-1">{region.description}</p>
          )} */}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3 mt-3">
        {ageCategories.map(({ label, ageRange, field }, i) => (
          <Fragment key={field}>
            {i > 0 && <div className="border-t border-gray-100" />}
            <Counter
              ageGroup={label}
              age={ageRange}
              value={quantity[field]}
              onAdd={() => handleQuantityChange(field, 1)}
              onSubtract={() => handleQuantityChange(field, -1)}
            />
          </Fragment>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex gap-2 items-center text-gray-900/60 font-light">
          <FaInfo className="text-[12px]" />
          <span className="text-sm">
            By proceeding, you confirm that you are a resident/citizen of the
            UAE.
          </span>
        </div>
      </div>

      <div className="w-full flex mt-4">
        <PrimaryButton
          className="w-full"
          type="submit"
          size="small"
          disabled={
            !startDate ||
            !endDate ||
            !region.id ||
            !group ||
            totalTravellers === 0
          }
          onClick={handleSubmit}
        >
          Search Policies
        </PrimaryButton>
      </div>
    </form>
  );
}
