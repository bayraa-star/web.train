import { useTranslation } from "react-i18next";

export const locales = ["mn", "en"];

const LanguageSwitch = () => {
  const { i18n } = useTranslation();
  const { language, changeLanguage } = i18n;
  return <div className="w-32 lg:flex md:flex hidden "></div>;
  return (
    <div className="flex items-center capitalize select-none gap-2 text-secondary-100 ml-8">
      <div className={`${language !== "mn" && "text-dark-20"} justify-center`}>
        <img
          alt=""
          src="https://www.countryflags.com/wp-content/uploads/japan-flag-png-large.png"
          style={{ width: 25, border: 0.5, borderStyle: "solid" }}
        />
        <div
          className="pointer text-center"
          onClick={() => {
            changeLanguage("mn");
          }}
        >
          {"MN"}
        </div>
      </div>
      <div
        className={`${
          language !== "en" && "text-dark-20"
        } ${"border-l-2 pl-2 justify-center"}`}
      >
        <img
          src="https://www.countryflags.com/wp-content/uploads/united-states-of-america-flag-png-large.png"
          style={{ width: 25, border: 0.5, borderStyle: "solid" }}
        />
        <div
          className="pointer text-center"
          onClick={() => {
            changeLanguage("en");
          }}
        >
          {"EN"}
        </div>
      </div>
      <div
        className={`${
          language !== "ru" && "text-dark-20"
        } ${"border-l-2 pl-2 justify-center"}`}
      >
        <img
          src="https://www.countryflags.com/wp-content/uploads/russia-flag-png-large.png"
          style={{ width: 25, border: 0.5, borderStyle: "solid" }}
        />
        <div
          className="pointer text-center"
          onClick={() => {
            changeLanguage("ru");
          }}
        >
          {"RU"}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitch;
