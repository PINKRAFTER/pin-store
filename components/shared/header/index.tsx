import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/images/logo.svg";
import Menu from "./menu";
import CategoryDrawer from "./category-drawer";
import Search from "./search";

const Header = () => {
  return (
    <header className="w-full border-b">
      <div className="wrapper flex-between">
        <div className="flex-start">
          <CategoryDrawer />
          <Link href="/" className="flex-start ml-2 md:mr-1">
            <Image
              src={logo}
              alt={`${APP_NAME} Logo`}
              height={48}
              width={48}
              priority={true}
            />
            <span className="hidden lg:block font-bold text-2xl ml-3">
              {APP_NAME}
            </span>
          </Link>
        </div>
        <div>
          <Search />
        </div>
        <Menu />
      </div>
    </header>
  );
};

export default Header;
