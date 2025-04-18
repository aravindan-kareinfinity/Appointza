class ValidatorUtil {
  mobilenumber = (text: string) => {
    let regex = RegExp('^\\d{10}$');
    return regex.test(text);
  };
  pincode = (text: string) => {
    let regex = RegExp('^\\d{6}$');
    return regex.test(text);
  };
  otp = (text: string) => {
    let regex = RegExp('^\\d{4}$');
    return regex.test(text);
  };
  required = (text: string) => {
    let isempty = text === null || text.trim() === '' || text.trim() === '0';
    return isempty;
  };
}
export const validatorutil = new ValidatorUtil();
