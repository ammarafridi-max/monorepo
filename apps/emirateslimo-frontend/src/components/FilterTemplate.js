'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function FilterTemplate({
  id,
  title,
  options,
  searchParamsName,
  activeFilterBox,
  setActiveFilterBox,
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [boxTitle, setBoxTitle] = useState(title);
  const isOpen = activeFilterBox === id;
  const ref = useRef(null);

  useEffect(() => {
    const paramValue = searchParams.get(searchParamsName);
    const selected = options.find((o) => o.value === paramValue);

    if (selected) {
      setBoxTitle(`${title}: ${selected.label}`);
    } else {
      const defaultOption = options[0];
      const newParams = new URLSearchParams(searchParams);
      newParams.set(searchParamsName, defaultOption.value);
      router.replace('?' + (newParams).toString(), { scroll: false });
      setBoxTitle(`${title}: ${defaultOption.label}`);
    }
  }, [searchParams, searchParamsName, options, title]);

  return (
    <div className="relative w-fit" ref={ref}>
      <button
        className="w-fit min-w-[100px] bg-white text-[14px] py-1.5 px-5 rounded-md shadow-sm cursor-pointer"
        onClick={() => setActiveFilterBox(isOpen ? '' : id)}
      >
        {boxTitle}
      </button>
      {isOpen && (
        <div className="absolute bg-white w-full min-w-[200px] divide-y divide-primary-100 rounded-sm border border-primary-100 shadow-sm shadow-primary-300 mt-2 overflow-hidden">
          {options.map((option) => (
            <p
              key={option.value}
              className="text-[14px] py-2 px-4 hover:bg-primary-100 cursor-pointer duration-300"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                option.value.toLowerCase() === 'all'
                  ? newParams.delete(searchParamsName)
                  : newParams.set(searchParamsName, option.value);

                router.replace('?' + (newParams).toString(), { scroll: false });
                setActiveFilterBox('');
                setBoxTitle(`${title}: ${option.label}`);
              }}
            >
              {option.label}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
