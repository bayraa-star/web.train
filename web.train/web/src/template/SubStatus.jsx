const SubStatus = ({ left, right }) => {
    return (
        <div
            className={`flex justify-between items-center text-sm leading-none p-2 mb-2 pb-4 border-b`}
        >
            <div>{left}</div>
            <div>{right}</div>
        </div>
    );
};

export default SubStatus;
