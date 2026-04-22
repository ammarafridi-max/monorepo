import Link from "next/link";

const columns = [
  {
    heading: "Products",
    links: ["Single Trip", "Annual Multi-Trip", "Family Plans", "Business Travel"],
  },
  {
    heading: "Company",
    links: ["About Us", "Careers", "Press", "Blog"],
  },
  {
    heading: "Support",
    links: ["Help Centre", "Make a Claim", "Contact Us", "Privacy Policy"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white mb-3">
            <span>🛡️</span> TravelShield
          </Link>
          <p className="text-sm leading-relaxed">
            Protecting travellers worldwide since 2018. Licensed and regulated
            in 40+ countries.
          </p>
        </div>
        {columns.map(({ heading, links }) => (
          <div key={heading}>
            <h4 className="font-semibold text-white mb-4">{heading}</h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link}>
                  <Link href="#" className="hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} TravelShield Insurance Ltd. All rights reserved.
      </div>
    </footer>
  );
}
