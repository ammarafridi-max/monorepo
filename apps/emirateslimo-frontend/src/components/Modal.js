'use client';

import { cloneElement, useState } from 'react';
import { useContext } from 'react';
import { createContext } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import { useOutsideClick } from '@travel-suite/frontend-shared/hooks/general/useOutsideClick';
import styled from 'styled-components';

const StyledOverlay = styled.div`
  height: 100vh;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
`;

const StyledWindow = styled.div`
  min-height: 10vh;
  max-height: 90vh;
  max-width: 80%;
  min-width: 20%;
  box-sizing: content-box;
  background-color: white;
  border-radius: 10px;
  overflow: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Button = styled.button`
  background: none;
  border: none;
  padding: 0.4rem;
  border-radius: var(--border-radius-sm);
  transform: translateX(0.8rem);
  transition: all 0.2s;
  position: absolute;
  top: 1.2rem;
  right: 1.9rem;
  cursor: pointer;

  &:hover {
    background-color: var(--color-grey-100);
  }

  & svg {
    width: 2.4rem;
    height: 2.4rem;
    color: var(--color-grey-500);
  }
`;

const ModalContext = createContext();

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
  const { ref } = useOutsideClick(close);

  if (openWindow !== openWindowName) return null;

  return createPortal(
    <StyledOverlay>
      <StyledWindow ref={ref}>
        <Button onClick={close}>
          <HiXMark />
        </Button>
        {cloneElement(children, { onCloseModal: close })}
      </StyledWindow>
    </StyledOverlay>,
    document.body,
  );
}

Modal.Window = Window;
Modal.Opens = Opens;

export default Modal;
