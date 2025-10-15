import { COMPANY_NAME } from "@/lib/constants";

const Footer = () => {
  return (
    <footer className="w-full border-t">
      <div className="wrapper py-4">
        <p className="text-center text-sm">
          &copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
