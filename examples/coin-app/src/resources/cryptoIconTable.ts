import cryptoIcon from './cryptoIcon.json';

export const iconTable: Record<string, any> = {};
cryptoIcon.forEach(crypto => {
  if (!(crypto.symbol in iconTable)) {
    iconTable[crypto.symbol] = crypto;
  }
});
