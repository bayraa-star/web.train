const IconCard = ({
    top,
    bottom,
    left,
    right,
    middle,
    containerClass ="",
}) => {
    return (
        <div className={`text-def-primary bg-white ${containerClass} p-4 shadow-lg`}>
            {top}
            <div className="flex justify-between">
                <div className="flex-shrink-0 self-center mr-2">{left}</div>
                <div className={`flex flex-grow`}>{middle}</div>
                <div className="flex-shrink-0 self-center ml-2">{right}</div>
            </div>
            {bottom}
        </div>
    );
};

export default IconCard;
