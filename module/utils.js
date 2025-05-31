import bcrypt from 'bcrypt';

const generate6DigitNumber = () => {
    const timestampPart = Date.now() % 10000;
    const randomPart = Math.floor(Math.random() * 90 + 10);
    return `${timestampPart}`.padStart(4, "0") + randomPart;
  };

  
const getHashedPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hassedPassword = await bcrypt.hash(password, salt);
    return hassedPassword;
  };


export { generate6DigitNumber, getHashedPassword };
