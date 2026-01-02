"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useLanguage } from "../context/LanguageContext";
import {
  AudioIcon,
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  ShootingStarIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  nameKey: string; // Translation key
  icon: React.ReactNode;
  path?: string;
  subItems?: { nameKey: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    nameKey: "dashboard",
    subItems: [{ nameKey: "ecommerce", path: "/", pro: false }],
  },
  {
    icon: <CalenderIcon />,
    nameKey: "calendar",
    path: "/calendar",
  },
  {
    icon: <UserCircleIcon />,
    nameKey: "userProfile",
    path: "/profile",
  },
  {
    icon: <AudioIcon />,
    nameKey: "classicalAlbums",
    subItems: [
      { nameKey: "composers", path: "/classical-albums/composers", pro: false },
      { nameKey: "compositions", path: "/classical-albums/compositions", pro: false },
      { nameKey: "artists", path: "/classical-albums/artists", pro: false },
      { nameKey: "recordings", path: "/classical-albums/recordings", pro: false },
      { nameKey: "albums", path: "/classical-albums/albums", pro: false },
    ],
  },
  {
    nameKey: "forms",
    icon: <ListIcon />,
    subItems: [{ nameKey: "formElements", path: "/form-elements", pro: false }],
  },
  {
    nameKey: "tables",
    icon: <TableIcon />,
    subItems: [{ nameKey: "basicTables", path: "/basic-tables", pro: false }],
  },
  {
    nameKey: "pages",
    icon: <PageIcon />,
    subItems: [
      { nameKey: "blankPage", path: "/blank", pro: false },
      { nameKey: "404Error", path: "/error-404", pro: false },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    nameKey: "charts",
    subItems: [
      { nameKey: "lineChart", path: "/line-chart", pro: false },
      { nameKey: "barChart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    nameKey: "uiElements",
    subItems: [
      { nameKey: "alerts", path: "/alerts", pro: false },
      { nameKey: "avatar", path: "/avatars", pro: false },
      { nameKey: "badge", path: "/badge", pro: false },
      { nameKey: "buttons", path: "/buttons", pro: false },
      { nameKey: "images", path: "/images", pro: false },
      { nameKey: "videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    nameKey: "authentication",
    subItems: [
      { nameKey: "signIn", path: "/signin", pro: false },
      { nameKey: "signUp", path: "/signup", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { t } = useLanguage();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.nameKey}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{t(nav.nameKey)}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{t(nav.nameKey)}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.nameKey}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {t(subItem.nameKey)}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => {
     // Exact match for root path
     if (path === "/") return pathname === "/";
     // For other paths, check if pathname starts with the path
     return pathname === path || pathname.startsWith(path + "/");
   }, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex items-center ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/" className="flex items-center gap-2">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <ShootingStarIcon className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Alpaii
              </span>
            </>
          ) : (
            <ShootingStarIcon className="w-8 h-8 text-purple-500" />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("menu")
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("others")
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>

        {/* Language Switcher */}
        <div className={`mt-auto pb-6 ${!isExpanded && !isHovered && !isMobileOpen ? "flex justify-center" : ""}`}>
          <LanguageSwitcher compact={!isExpanded && !isHovered && !isMobileOpen} />
        </div>
      </div>
    </aside>
  );
};

function LanguageSwitcher({ compact }: { compact: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex ${compact ? "flex-col gap-1" : "gap-2"}`}>
      <button
        onClick={() => setLanguage("ko")}
        className={`px-3 py-1.5 text-sm rounded transition-colors ${
          language === "ko"
            ? "bg-brand-500 text-white"
            : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
        }`}
        title="한국어"
      >
        {compact ? "KO" : "한국어"}
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1.5 text-sm rounded transition-colors ${
          language === "en"
            ? "bg-brand-500 text-white"
            : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
        }`}
        title="English"
      >
        {compact ? "EN" : "English"}
      </button>
    </div>
  );
}

export default AppSidebar;
