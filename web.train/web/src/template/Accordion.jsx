import { useState } from "react";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";

const Accordion = ({ title, children, open: defaultOpen, titleClass }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div>
            <div
                className={`flex items-center ${titleClass} cursor`}
                onClick={() => {
                    setOpen(!open);
                }}
            >
                <div className="flex-shrink-0 text-xl mr-2">
                    {open ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                </div>
                <div className="flex flex-grow">{title}</div>
            </div>
            {open && children}
        </div>
    );
};

export default Accordion;
