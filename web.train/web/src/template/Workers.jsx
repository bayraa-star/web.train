const Workers = ({ workers, label }) => {
    if (!workers) return null;

    return (
        <div className="mt-2 flex flex-wrap items-center text-sm">
            <div className="mr-1">{label}</div>
            {Array.isArray(workers) &&
                workers.map(({ firstname, lastname }, index) => {
                    return (
                        <div
                            key={index}
                            className="p-1 mr-1 rounded bg-def-gray"
                        >
                            {firstname} {lastname}
                        </div>
                    );
                })}
        </div>
    );
};

export default Workers;
