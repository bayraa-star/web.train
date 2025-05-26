import { DB, DOMAIN } from "../consts";
import Agenda from "agenda";
import { io } from "../server";
import moment from "moment";
const agenda = new Agenda({ db: { address: DB } });

agenda.define("SENTSTATS", async () => {
  // console.log("START");
});

export default agenda;
