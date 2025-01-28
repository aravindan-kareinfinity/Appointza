import moment from 'moment';

class DateUtil {
  getDate(req: Date) {
    const formattedDate = moment(req).format('DD/MM/YYYY');
    return formattedDate;
  }
}
export const dateutil = new DateUtil();
