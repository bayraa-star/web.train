import { renderMedia } from "../inputs/FileUpload";

const Media = ({ files }) => {
    if (!files || files?.length === 0) return null;

    const [file] = files;

    if (!file.id) return null;

    return renderMedia(file);
};

export default Media;
