import {
  Car,
  Element4,
  Information,
  MonitorRecorder,
  I3Dcube,
  User,
  DirectSend,
  TableDocument,
  Driver,
  ShieldSearch,
  CalendarRemove,
} from "iconsax-react";

const MENU = [
  {
    label: "Хэрэглэгч",
    path: "/app/user",
    name: `user`,
    icon: <User size={25} />,
  },

  {
    label: "Үйлдлийн түүх",
    path: "/app/log",
    name: `log`,
    icon: <TableDocument size={25} />,
  },
];

export default MENU;
