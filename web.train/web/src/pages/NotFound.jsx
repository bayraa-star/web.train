import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { RiArrowLeftLine } from "react-icons/ri";
import LanguageSwitch from "../language/Switch";

const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col h-screen justify-center items-center">
      <LanguageSwitch />
      <h3>
        <span>404</span> {`Хуудас олдсонгүй`}
      </h3>
      <div
        className="pointer flex items-center text-dark-100"
        onClick={() => {
          navigate(-1);
        }}
      >
        <RiArrowLeftLine className="mr-2" />
        {`Буцах`}
      </div>
    </div>
  );
};

export default NotFound;
