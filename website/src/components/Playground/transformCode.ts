const transformCode = (code: string) => {
  return code.replaceAll(/^(import.+$|export (default )?)/gm, '');
};
export default transformCode;
