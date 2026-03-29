import Job from "../models/job";
import File from "../models/file";
import { table } from "../utils/db";
import { Exception } from "../utils";

const getLabelerAssignedJobIds = async (userId) => {
  if (!userId) {
    return [];
  }

  return File.distinct("job", {
    assignedTo: userId,
    job: { $ne: null },
  });
};

const getJobScope = async (request) => {
  if (request?.user?.role !== "labeler") {
    return {};
  }

  const jobIds = await getLabelerAssignedJobIds(request.user.id);

  return {
    _id: {
      $in: jobIds,
    },
  };
};

export const getAccessibleJobById = (id) => {
  return Job.findOne({
    _id: id,
  });
};

export const getJobById = (request) => {
  return getAccessibleJobById(request.params.id);
};

export const addJob = (request) => {
  const job = new Job(request.body);

  return job.save();
};

export const updateJobById = (request) => {
  return Job.findOneAndUpdate(
    {
      _id: request.params.id,
    },
    request.body,
    { new: true }
  );
};

export const deleteJobById = async (request) => {
  const linkedFile = await File.findOne({
    job: request.params.id,
  }).lean();

  if (linkedFile) {
    throw new Exception("This job cannot be deleted because uploaded files are linked to it");
  }

  return Job.deleteOne({
    _id: request.params.id,
  });
};

export const getJobTable = async (request) => {
  const { body } = request;
  const scope = await getJobScope(request);

  return table(
    Job,
    {
      ...body,
      find: {
        ...(body?.find || {}),
        ...scope,
      },
    },
    {
      chain: (base) => base,
    }
  );
};
