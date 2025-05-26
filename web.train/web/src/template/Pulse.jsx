const Pulse = ({ color }) => {
	return (
		<span className="flex h-3 w-3 ml-2 absolute top-0 right-0">
			<span
				className={`animate-ping absolute inline-flex h-4 w-4 -mt-1 -ml-1 rounded-full ${
					color ? color : "bg-primary-100"
				} opacity-75`}
			></span>
			<span
				className={`relative inline-flex rounded-full h-2 w-2 ${
					color ? color : "bg-primary-100"
				}`}
			></span>
		</span>
	);
};

export default Pulse;
