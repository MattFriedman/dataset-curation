import React from 'react';
import ReactDOM from 'react-dom';

function Welcome() {
  return <h2>Welcome to React in Dataset Curation App</h2>;
}

ReactDOM.render(
  <Welcome />,
  document.getElementById('react-root')
);

console.log('React component rendered');
