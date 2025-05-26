export const table = async (
  Model,
  { find = {}, sort = { _id: -1 }, offset = 0, limit = 20 },
  { chain } = {}
) => {
  const skip = offset * limit;

  let countPromise = Model.count(find);
  let promise = Model.find(find)
    .sort(sort)
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .lean();

  if (chain) {
    promise = chain(promise);
  }

  let [total, items] = await Promise.all([countPromise, promise]);

  return {
    total,
    skip,
    limit,
    offset,
    items,
  };
};
