import ReactPaginate from "react-paginate";

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

const paginationItemClass =
  "h-10 min-w-[2.5rem] px-3 flex items-center justify-center m-1 cursor border text-sm rounded";

const QueuePagination = ({
  total = 0,
  page = 0,
  pageSize = PAGE_SIZE_OPTIONS[1],
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = total < 1 ? 0 : page * pageSize + 1;
  const end = total < 1 ? 0 : Math.min(total, (page + 1) * pageSize);

  return (
    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-gray-500">
        {`Showing ${start}-${end} of ${total}`}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center text-sm text-gray-500">
          Per page
          <select
            className="ml-2 h-10 rounded border bg-white px-2 text-black"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <ReactPaginate
          forcePage={Math.min(page, totalPages - 1)}
          onPageChange={({ selected }) => onPageChange(selected)}
          pageCount={totalPages}
          pageRangeDisplayed={3}
          marginPagesDisplayed={1}
          renderOnZeroPageCount={null}
          containerClassName="flex flex-wrap items-center select-none text-black"
          nextLabel=">"
          previousLabel="<"
          nextLinkClassName={paginationItemClass}
          previousLinkClassName={paginationItemClass}
          pageLinkClassName={paginationItemClass}
          breakLinkClassName={paginationItemClass}
          activeLinkClassName="bg-black text-white"
          disabledClassName="pointer-events-none opacity-50"
        />
      </div>
    </div>
  );
};

export default QueuePagination;
