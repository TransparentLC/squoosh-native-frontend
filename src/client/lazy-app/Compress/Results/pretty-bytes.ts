// Based on https://www.npmjs.com/package/pretty-bytes
// Modified so the units are returned separately.

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

interface PrettyBytesResult {
  value: string;
  unit: string;
}

export default function prettyBytes(number: number): PrettyBytesResult {
  const isNegative = number < 0;
  const prefix = isNegative ? '-' : '';

  if (isNegative) number = -number;
  if (number < 1) return { value: prefix + number, unit: UNITS[0] };

  let exponent = 0;
  while (number > 1024) {
    number /= 1024;
    exponent++;
  }

  return {
    unit: UNITS[exponent],
    value: prefix + number.toPrecision(3),
  };
}
