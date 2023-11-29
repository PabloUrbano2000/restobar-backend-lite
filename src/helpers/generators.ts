import moment from "moment";
export const generatePassword = (numberCharacters: number) => {
  const arrayCharacters = [
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "W",
    "X",
    "Y",
    "Z",
    "@",
    "-",
    "y",
    "Z",
    "1",
    "2",
    "3",
    "4",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "5",
    "6",
    "7",
    "g",
    "h",
    "i",
    "j",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "n",
    "o",
    "k",
    "l",
    "m",
    "8",
    "9",
    "0",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "K",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
  ];

  let generateWord = "";
  for (let i = 0; i < numberCharacters; i++) {
    const indexObtain: number = parseInt(
      Math.round(Math.random() * (arrayCharacters.length - 1)).toString()
    );
    const letterRandom = arrayCharacters[indexObtain];
    generateWord = `${generateWord}${letterRandom}`;
  }

  return generateWord;
};

export const generateUTCToLimaDate = () => {
  const date = new Date(
    moment
      .utc()
      .add(-(5 * 60 * 60 * 1000))
      .toString()
  );
  return date;
};
