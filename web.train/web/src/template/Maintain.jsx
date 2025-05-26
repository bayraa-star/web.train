import { IoIosConstruct } from "react-icons/io";
import { useTranslation } from "react-i18next";
const Maintain = () => {
	const { t } = useTranslation();

	return (
		<div className="text-4xl p-4 text-center flex flex-col items-center opacity-10">
			<div className="mb-4">{t("title.maintaining")}</div>
			<IoIosConstruct size={250} />
		</div>
	);
};

export default Maintain;
