// Import the original mapper
import { RestEndpoint } from '@data-client/rest';
import MDXComponents from '@theme-original/MDXComponents';
import React from 'react';

function Table(props) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  );
}

export default {
  ...MDXComponents,
  RestEndpoint,
  table: Table,
};
