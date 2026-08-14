"use client";

import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import { MapPin } from "lucide-react";

const ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  maps: MapPin,
};

const LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  maps: "Google Maps",
};

const TONES = {
  dark: "border-gray-700 text-gray-400 hover:border-white hover:bg-white hover:text-gray-900",
  light:
    "border-gray-200 text-gray-500 hover:border-primary-600 hover:bg-primary-600 hover:text-white",
};

export default function SocialLinks({ socials = [], tone = "dark", size = 15, className = "" }) {
  const visible = socials.filter(({ platform, href }) => ICONS[platform] && href);
  if (!visible.length) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {visible.map(({ platform, href, label }) => {
        const Icon = ICONS[platform];
        const name = label || LABELS[platform] || platform;
        return (
          <li key={platform}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              title={name}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${TONES[tone] ?? TONES.dark}`}
            >
              <Icon size={size} aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
