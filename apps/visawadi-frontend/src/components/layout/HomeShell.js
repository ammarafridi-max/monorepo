import StickyWhatsApp from "@travel-suite/frontend-shared/components/ui/v2/StickyWhatsApp";
import HomeHeader from "@/components/layout/HomeHeader";
import HomeFooter from "@/components/layout/HomeFooter";
import HomeTabBar from "@/components/layout/HomeTabBar";
import { WHATSAPP_NUMBER } from "@/config/contact";

export default function HomeShell({ children }) {
  return (
    <div
      data-vw-root
      className="pb-[calc(58px+env(safe-area-inset-bottom,0px))] lg:pb-0"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <HomeHeader />
      <main id="main">{children}</main>
      <HomeFooter />
      <HomeTabBar />

      {WHATSAPP_NUMBER && (
        <StickyWhatsApp
          phoneNumber={WHATSAPP_NUMBER}
          bottomOffset="calc(74px + env(safe-area-inset-bottom, 0px))"
        />
      )}
    </div>
  );
}
