const transformCode = code => {
  return code.replaceAll(/^(import.+$|export (default )?)/gm, '');
};
export default transformCode;
