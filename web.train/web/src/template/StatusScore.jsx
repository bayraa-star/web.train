const COLOR = {
    red: "text-def-red",
    green: "text-def-green",
    orange: "text-def-orange",
};

const StatusScore = ({ color = "red", value }) => {
    return (
        <div
            className={`flex justify-center items-center w-8 h-8 font-semibold bg-white rounded-lg text-sm ${COLOR[color]} leading-none mr-1`}
        >
            <div>{value}</div>
        </div>
    );
};

export default StatusScore;
