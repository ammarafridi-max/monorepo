'use client';

import { FaEnvelope } from 'react-icons/fa';
import InputWithIcon from './InputWithIcon';

export default function Email({ email, onChange }) {
  return (
    <InputWithIcon
      type="email"
      value={email}
      onChange={onChange}
      required
      name="email"
      id="email"
      autoComplete="on"
      icon={<FaEnvelope />}
      placeholder="Enter email address"
    />
  );
}
