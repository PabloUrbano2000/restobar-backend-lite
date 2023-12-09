const formatDatetoYYYYMMDDHHmmSS = (date: Date, separator = "/") => {
  const year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();

  let hours = date.getUTCHours();
  let minutes = date.getUTCMinutes();
  let seconds = date.getUTCSeconds();

  month++;
  const monthString = month < 10 ? `0${month}` : `${month}`;
  const dayString = day < 10 ? `0${day}` : `${day}`;
  const hoursString = hours < 10 ? `0${hours}` : `${hours}`;
  const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${year}${separator}${monthString}${separator}${dayString} ${hoursString}:${minutesString}:${secondsString}`;
};

const formatDatetoYYYYMMDD = (date: Date, separator = "/") => {
  const year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();

  month++;
  const monthString = month < 10 ? `0${month}` : `${month}`;
  const dayString = day < 10 ? `0${day}` : `${day}`;

  return `${year}${separator}${monthString}${separator}${dayString}`;
};

export { formatDatetoYYYYMMDDHHmmSS, formatDatetoYYYYMMDD };
