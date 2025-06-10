import React from 'react';

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h1>{statusCode ? `An error ${statusCode} occurred` : 'An error occurred'}</h1>
      <p>Sorry, something went wrong.</p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
