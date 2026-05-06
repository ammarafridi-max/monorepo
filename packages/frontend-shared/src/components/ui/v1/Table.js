'use client';

import { useContext, createContext } from 'react';
import NextLink from 'next/link';

const TableContext = createContext();

function Table({ children, $columntemplate }) {
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <TableContext.Provider value={{ $columntemplate }}>
        {children}
      </TableContext.Provider>
    </div>
  );
}

function Head({ children }) {
  const { $columntemplate } = useContext(TableContext);
  return (
    <div
      className="grid bg-linear-to-r from-primary-900 via-primary-800 to-primary-700 text-white text-sm font-medium py-3.5 px-6 items-center border-b border-white/10"
      style={{ gridTemplateColumns: $columntemplate.replace(/_/g, ' ') }}
    >
      {children}
    </div>
  );
}

function Heading({ children, textAlign = 'left' }) {
  const alignClass =
    textAlign === 'center'
      ? 'text-center'
      : textAlign === 'right'
        ? 'text-right'
        : 'text-left';
  return (
    <p
      className={`tracking-[0.08em] ${alignClass} text-[12px] uppercase font-semibold text-white/95`}
    >
      {children}
    </p>
  );
}

function Row({ children, onClick, href }) {
  const { $columntemplate } = useContext(TableContext);
  const Component = href ? NextLink : 'div';
  const clickable = Boolean(href || onClick);
  const linkProps = href ? { href } : {};

  return (
    <Component
      onClick={onClick}
      {...linkProps}
      className={`group grid items-center py-3.5 px-6 gap-3 text-[15px] text-gray-800 border-b border-gray-100/80 transition-all duration-200 ${
        clickable ? 'cursor-pointer hover:bg-primary-50/40' : 'cursor-default'
      }`}
      style={{ gridTemplateColumns: $columntemplate.replace(/_/g, ' ') }}
    >
      {children}
    </Component>
  );
}

function Item({ children, textAlign = 'left', textTransform = 'none' }) {
  const alignClass =
    textAlign === 'center'
      ? 'text-center'
      : textAlign === 'right'
        ? 'text-right'
        : 'text-left';
  return (
    <p
      className={`text-[14px] leading-5 text-gray-700 ${alignClass} ${textTransform} flex flex-col`}
    >
      {children}
    </p>
  );
}

function Footer({ children }) {
  return (
    <div className="bg-gray-50/80 text-gray-600 text-[13px] py-3.5 px-6 border-t border-gray-200/80">
      {children}
    </div>
  );
}

function Link({ href, children }) {
  return (
    <a
      href={href}
      className="text-primary-700 hover:text-primary-800 hover:underline font-medium cursor-pointer transition-colors"
    >
      {children}
    </a>
  );
}

function DeleteLink({ onClick, isDeleting }) {
  return (
    <button
      disabled={isDeleting}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      type="button"
      className="bg-red-50 text-red-700 border border-red-100 text-[11px] px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium transition-colors cursor-pointer disabled:opacity-60"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}

function DuplicateLink({ onClick, isDuplicating }) {
  return (
    <button
      disabled={isDuplicating}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      type="button"
      className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition-colors cursor-pointer disabled:opacity-60"
    >
      {isDuplicating ? 'Duplicating...' : 'Duplicate'}
    </button>
  );
}

Table.Head = Head;
Table.Heading = Heading;
Table.Row = Row;
Table.Item = Item;
Table.Footer = Footer;
Table.Link = Link;
Table.DeleteLink = DeleteLink;
Table.DuplicateLink = DuplicateLink;

export default Table;
