const delay = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const getTransaction = async (connection, signature) => {
  try {
    let transData;
    let tries = 0;

    while (!transData && tries < 4) {
      transData = await connection.getTransaction(signature, {
        commitment: 'confirmed',
      });
      tries += 1;
      await delay(30);
    }

    if (signature !== transData?.transaction?.signatures?.[0] ?? '') {
      console.error(
        `Signature mismatched: ${signature}, ${transData?.transaction?.signatures?.[0]}`,
      );
    }

    return transData;
  } catch (err) {
    console.log({ 'Error in getTransaction': { err, signature } });

    return null;
  }
};

module.exports = { getTransaction };
