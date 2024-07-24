import appRoot from 'app-root-path';

export function getExchangeDir() {
  return `${appRoot.toString()}/exchange`;
}
