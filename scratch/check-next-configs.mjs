import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
console.log('nextVitals is array:', Array.isArray(nextVitals));
console.log('nextTs is array:', Array.isArray(nextTs));
if (Array.isArray(nextVitals)) {
  console.log(
    'nextVitals[0] plugins:',
    nextVitals[0].plugins ? Object.keys(nextVitals[0].plugins) : 'none'
  );
} else {
  console.log('nextVitals keys:', Object.keys(nextVitals));
}
