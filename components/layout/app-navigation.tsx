import { Suspense } from "react";
import { ActiveNavLinks } from "./active-nav-links";
import { NavLinks } from "./nav-links";

/** PC（md 以上）の左サイドバー */
export function SidebarNavigation() {
  return (
    <nav
      aria-label="メインメニュー"
      className="hidden w-56 shrink-0 border-r border-gray-300 bg-white p-4 md:block"
    >
      <div className="sticky top-20">
        <Suspense fallback={<NavLinks variant="sidebar" pathname={null} />}>
          <ActiveNavLinks variant="sidebar" />
        </Suspense>
      </div>
    </nav>
  );
}

/** スマホ（md 未満）の画面下部に固定するメニュー */
export function BottomNavigation() {
  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-300 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Suspense fallback={<NavLinks variant="bottom" pathname={null} />}>
        <ActiveNavLinks variant="bottom" />
      </Suspense>
    </nav>
  );
}
