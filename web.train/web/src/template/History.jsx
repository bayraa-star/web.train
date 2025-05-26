import { useTranslation } from "react-i18next";
import CreatedBy from "./CreatedBy";
import Gallery from "./Gallery";

const History = ({ items, status_root, hidden }) => {
    const { t } = useTranslation();

    if (!items || items?.length === 0) return null;

    return (
        <div>
            <div className="uppercase mb-2 pb-2 border-b">
                {t("fields.history")}
            </div>
            {items.map(
                ({ created, createdby, status, desc, attachments }, index) => {
                    return (
                        <div
                            key={index}
                            className="mb-2 pb-2 border-b border-dashed"
                        >
                            <CreatedBy
                                user={createdby}
                                date={created}
                                hidden={hidden && hidden(status)}
                            />
                            <div className="text-sm my-2">
                                <div className="font-semibold">
                                    {t(`const.${status_root}.${status}`)}
                                </div>
                                <div>{desc}</div>
                            </div>
                            <Gallery files={attachments} width="w-1/3" />
                        </div>
                    );
                }
            )}
        </div>
    );
};

export default History;
