"use client";

import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

export default function VisaPricingBreakdown({ rows = [] }) {
  if (!rows.length) return null;
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const currency = rows[0]?.currency || "AED";

  return (
    <section className="py-12 md:py-16 bg-gray-50/80 border-y border-gray-100">
      <Container>
        <SectionHead eyebrow="Full fee transparency" title="Cost Breakdown" />
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left font-outfit font-semibold text-[11px] text-gray-400 uppercase tracking-wider px-5 py-3">
                  Item
                </th>
                <th className="text-left font-outfit font-semibold text-[11px] text-gray-400 uppercase tracking-wider px-5 py-3">
                  Paid to
                </th>
                <th className="text-right font-outfit font-semibold text-[11px] text-gray-400 uppercase tracking-wider px-5 py-3">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-outfit font-medium text-[15px] text-gray-800">
                      {row.item}
                    </p>
                    {row.note && (
                      <p className="font-outfit font-light text-[13px] text-gray-400 mt-0.5">
                        {row.note}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-outfit font-light text-[14px] text-gray-500 whitespace-nowrap">
                    {row.paidTo || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-outfit font-semibold text-[15px] text-gray-900 whitespace-nowrap">
                    {row.currency || currency} {Number(row.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td
                  colSpan={2}
                  className="px-5 py-3 font-outfit font-semibold text-[12px] text-gray-500 uppercase tracking-wider"
                >
                  Indicative Total
                </td>
                <td className="px-5 py-3 text-right font-outfit font-bold text-[16px] text-gray-900 whitespace-nowrap">
                  {currency} {total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 font-outfit font-light text-[11px] text-gray-400 max-w-2xl leading-5">
          Prices are indicative. Government and third-party fees are passed
          through at cost and may change without notice.
        </p>
      </Container>
    </section>
  );
}
