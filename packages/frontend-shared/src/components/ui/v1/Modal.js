'use client';

import { cloneElement, useRef, useState } from 'react';
import { useContext } from 'react';
import { createContext } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';

export const ModalContext = createContext();

function Modal({ children }) {
  const [openWindowName, setOpenWindowName] = useState('');
  const open = (windowName) => setOpenWindowName(windowName);
  const close = () => setOpenWindowName('');
  return (
    <ModalContext.Provider value={{ openWindowName, open, close }}>
      {children}
    </ModalContext.Provider>
  );
}

function Opens({ children, openWindowName }) {
  const { open } = useContext(ModalContext);
  return cloneElement(children, { onClick: () => open(openWindowName) });
}

function Window({ children, openWindowName: openWindow }) {
  const { openWindowName, close } = useContext(ModalContext);
  const ref = useRef(null);
  useOutsideClick(ref, close);

  if (openWindow !== openWindowName) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={ref}
        className="relative min-h-[10vh] max-h-[90vh] min-w-[20%] max-w-[80%] overflow-auto rounded-[10px] bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-6 top-5 grid h-8 w-8 place-items-center rounded-md text-gray-500 transition-colors hover:bg-gray-100"
        >
          <HiXMark />
        </button>
        {cloneElement(children, { onCloseModal: close })}
      </div>
    </div>,
    document.body
  );
}

Modal.Window = Window;
Modal.Opens = Opens;

export default Modal;
