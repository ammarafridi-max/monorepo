'use client';

import { useState, useRef } from 'react';
import { useAirports } from '../../../hooks/airports/useAirports';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';

export default function SelectAirport({ value, onChange, id, icon }) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const { airports, isLoadingAirports } = useAirports(query);
  const containerRef = useRef();

  useOutsideClick(containerRef, () => setIsOpen(false));

  function handleChange(e) {
    setQuery(e.target.value);
    onChange(null);
    setIsOpen(true);
  }

  function handleSelect(airport) {
    const display = `${airport.address.cityName} (${airport.iataCode})`;
    setQuery(display);
    setIsOpen(false);
    onChange(display);
  }

  function handleClick() {
    if (typeof value === 'string' && value.length > 0) setQuery('');
    setIsOpen(true);
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={query}
          onChange={handleChange}
          onClick={handleClick}
          placeholder="Search airport or city..."
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-full placeholder:text-gray-400 pr-10"
        />
        {icon && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          <ul className="max-h-72 overflow-y-auto py-1">
            {isLoadingAirports && <ListItem muted>Loading airports…</ListItem>}

            {!isLoadingAirports && query.trim().length < 3 && (
              <ListItem muted>Enter at least 3 characters</ListItem>
            )}

            {!isLoadingAirports && query.trim().length >= 3 && airports.length === 0 && (
              <ListItem muted>No airports found</ListItem>
            )}

            {!isLoadingAirports &&
              airports.map((airport) => (
                <ListItem key={airport.iataCode} onClick={() => handleSelect(airport)}>
                  {airport.address.cityName}{' '}
                  <span className="text-gray-400">({airport.iataCode})</span>
                </ListItem>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ListItem({ children, muted = false, ...props }) {
  return (
    <li
      {...props}
      className={`px-4 py-2.5 text-sm transition-colors ${
        muted
          ? 'text-gray-400 cursor-default'
          : 'text-gray-800 cursor-pointer hover:bg-primary-50 hover:text-primary-700'
      }`}
    >
      {children}
    </li>
  );
}
